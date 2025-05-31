/// This module implements an on-chain raffle system for SheExcels NFT holders
module she_excel::raffle {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use std::vector;
    use std::hash;
    use std::bcs;

    // Error codes
    const ERegistryAlreadyFinalized: u64 = 0;
    const ERegistryNotFinalized: u64 = 1;
    const EInsufficientOwners: u64 = 2;

    /// Capability for raffle administration - anyone with this can run raffles
    public struct RaffleCap has key, store {
        id: UID
    }

    /// Registry of NFT owners eligible for the raffle
    public struct NFTOwnerRegistry has key {
        id: UID,
        /// List of owner addresses
        owners: vector<address>,
        /// Whether the registry is finalized and can no longer be modified
        finalized: bool
    }

    /// Result of a raffle
    public struct RaffleResult has key {
        id: UID,
        winners: vector<address>,
        timestamp: u64,
        raffle_id: u64
    }

    // Events
    /// Event emitted when the registry is initialized
    public struct RegistryInitialized has copy, drop {
        registry_id: ID,
        owner_count: u64
    }

    /// Event emitted when the registry is finalized
    public struct RegistryFinalized has copy, drop {
        registry_id: ID,
        owner_count: u64
    }

    /// Event emitted when a raffle is run
    public struct RaffleCompleted has copy, drop {
        result_id: ID,
        winners: vector<address>,
        timestamp: u64,
        raffle_id: u64
    }

    /// Initialize the module - creates admin capability and owner registry
    fun init(ctx: &mut TxContext) {
        // Create the admin capability
        let cap = RaffleCap {
            id: object::new(ctx)
        };
        
        // Create and share the NFT owner registry
        let registry = NFTOwnerRegistry {
            id: object::new(ctx),
            owners: vector::empty<address>(),
            finalized: false
        };

        // Emit an event for the registry creation
        event::emit(RegistryInitialized {
            registry_id: object::id(&registry),
            owner_count: 0
        });

        // Transfer the admin capability to the transaction sender
        transfer::transfer(cap, tx_context::sender(ctx));
        
        // Share the registry as a shared object
        transfer::share_object(registry);
    }

    /// Initialize the owner registry with the list of NFT owners
    public entry fun initialize_owner_registry(
        _: &RaffleCap,
        registry: &mut NFTOwnerRegistry,
        owners: vector<address>,
        _ctx: &mut TxContext
    ) {
        // Ensure the registry is not already finalized
        assert!(!registry.finalized, ERegistryAlreadyFinalized);

        // Set the owners
        registry.owners = owners;

        // Emit an event for the registry initialization
        event::emit(RegistryInitialized {
            registry_id: object::id(registry),
            owner_count: vector::length(&registry.owners)
        });
    }

    /// Finalize the owner registry to prevent further changes
    public entry fun finalize_owner_registry(
        _: &RaffleCap,
        registry: &mut NFTOwnerRegistry,
        _ctx: &mut TxContext
    ) {
        // Ensure the registry is not already finalized
        assert!(!registry.finalized, ERegistryAlreadyFinalized);

        // Finalize the registry
        registry.finalized = true;

        // Emit an event for the registry finalization
        event::emit(RegistryFinalized {
            registry_id: object::id(registry),
            owner_count: vector::length(&registry.owners)
        });
    }

    /// Run the raffle to select winners
    public entry fun run_raffle(
        _: &RaffleCap,
        registry: &NFTOwnerRegistry,
        winner_count: u64,
        ctx: &mut TxContext
    ) {
        // Ensure the registry is finalized
        assert!(registry.finalized, ERegistryNotFinalized);

        // Ensure we have enough owners
        let owner_count = vector::length(&registry.owners);
        assert!(owner_count >= winner_count, EInsufficientOwners);
        
        // Get randomness from the transaction context
        let tx_digest = tx_context::digest(ctx);
        
        // Select winners using the transaction digest as a source of randomness
        let winners = select_random_winners(*tx_digest, &registry.owners, winner_count);
        
        // Create the raffle result
        let result = RaffleResult {
            id: object::new(ctx),
            winners,
            timestamp: tx_context::epoch(ctx),
            raffle_id: tx_context::epoch_timestamp_ms(ctx)
        };
        
        // Emit an event for the raffle completion
        event::emit(RaffleCompleted {
            result_id: object::id(&result),
            winners: result.winners,
            timestamp: result.timestamp,
            raffle_id: result.raffle_id
        });
        
        // Share the result as a shared object
        transfer::share_object(result);
    }

    /// Helper function to select random winners from the list of owners
    fun select_random_winners(
        tx_digest_bytes: vector<u8>,
        owners: &vector<address>,
        winner_count: u64
    ): vector<address> {
        // Check if we have enough owners
        let owner_count = vector::length(owners);
        assert!(owner_count >= winner_count, EInsufficientOwners);

        // Create a copy of the owners vector to modify
        let mut owners_copy = *owners;
        
        // Initialize winners vector
        let mut winners = vector::empty<address>();

        // Use the transaction digest as a seed for randomness
        let mut seed = tx_digest_bytes;
        
        // Counter for the loop
        let mut i = 0;
        
        while (i < winner_count && vector::length(&owners_copy) > 0) {
            // Generate a random index based on the current seed
            let random_index = derive_random_index(&seed, vector::length(&owners_copy));
            
            // Select a winner and remove them from the pool
            let winner = vector::swap_remove(&mut owners_copy, random_index);
            vector::push_back(&mut winners, winner);
            
            // Update counter
            i = i + 1;
            
            // Update the seed for the next iteration to ensure different randomness
            // We'll just append the winner's address bytes to the seed
            let winner_bytes = address_to_bytes(winner);
            vector::append(&mut seed, winner_bytes);
        };

        winners
    }
    
    /// Helper function to derive a random index from a seed and range
    fun derive_random_index(seed: &vector<u8>, range: u64): u64 {
        if (range == 0) {
            return 0
        };
        
        // Hash the seed to get a pseudo-random value
        let hash_bytes = hash::sha3_256(*seed);
        
        // Use the first 8 bytes to create a u64
        let mut random_value: u64 = 0;
        let mut i = 0;
        while (i < 8 && i < vector::length(&hash_bytes)) {
            let byte_val = (*vector::borrow(&hash_bytes, i) as u64);
            // Use addition instead of bit shifting to avoid type issues
            random_value = random_value + (byte_val * (if (i == 0) 1 else if (i == 1) 256 else if (i == 2) 65536 else if (i == 3) 16777216 else if (i == 4) 4294967296 else if (i == 5) 1099511627776 else if (i == 6) 281474976710656 else 72057594037927936));
            i = i + 1;
        };
        
        // Return the value modulo the range
        random_value % range
    }
    
    /// Helper function to convert an address to bytes for randomness
    fun address_to_bytes(addr: address): vector<u8> {
        // Simple implementation - just use the address as a 32-byte value
        let mut result = vector::empty<u8>();
        let mut i = 0;
        let addr_bytes = bcs::to_bytes(&addr);
        
        // Copy the address bytes to our result
        while (i < vector::length(&addr_bytes)) {
            vector::push_back(&mut result, *vector::borrow(&addr_bytes, i));
            i = i + 1;
        };
        
        result
    }
}
