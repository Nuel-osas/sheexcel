/// SheExcels NFT - Proof of Participation
/// This module allows attendees of the SheExcels event to mint NFTs as proof of participation
module she_excel::she_excel {
    use sui::package;
    use sui::display;
    use sui::tx_context;
    use sui::object;
    use sui::transfer;
    use sui::event;
    use std::string;
    use sui::url;
    // Default IPFS CID for the SheExcels NFT image
    const DEFAULT_IPFS_CID: vector<u8> = b"bafybeihigtndth4zrl3hakmnvy23s6ahxb4hg237fzp7j7e73kw7sokare";
    const DEFAULT_IPFS_GATEWAY: vector<u8> = b"https://ipfs.io/ipfs/";

    // One-time witness for this module
    public struct SHE_EXCEL has drop {}

    /// A SheExcels NFT representing proof of participation
    public struct SheExcelsNFT has key, store {
        id: object::UID,
        /// The name of the event
        name: string::String,
        /// Description of the event
        description: string::String,
        /// URL for the NFT image
        image_url: url::Url,
        /// Date of the event
        event_date: string::String,
    }

    /// Capability that represents the authority to mint NFTs
    public struct AdminCap has key, store {
        id: object::UID
    }

    /// Event emitted when a new NFT is minted
    public struct NFTMinted has copy, drop {
        // The Object ID of the NFT
        nft_id: object::ID,
        // The address of the recipient
        recipient: address,
        // The name of the event
        event_name: string::String,
    }

    /// Creates a new admin capability during module initialization
    fun init(otw: SHE_EXCEL, ctx: &mut tx_context::TxContext) {
        let admin_cap = AdminCap {
            id: object::new(ctx)
        };
        
        // Transfer the admin capability to the module publisher
        transfer::transfer(admin_cap, tx_context::sender(ctx));
        
        // Create the Publisher object
        let publisher = package::claim(otw, ctx);
        
        // Create a Display object for the SheExcelsNFT
        let keys = vector[
            string::utf8(b"name"),
            string::utf8(b"description"),
            string::utf8(b"image_url"),
            string::utf8(b"event_date"),
            string::utf8(b"project_url"),
            string::utf8(b"creator")
        ];
        
        let values = vector[
            string::utf8(b"{name}"),
            string::utf8(b"{description}"),
            string::utf8(b"{image_url}"),
            string::utf8(b"{event_date}"),
            string::utf8(b"https://sheexcels.io"),
            string::utf8(b"SheExcels")
        ];
        
        let mut display = display::new_with_fields<SheExcelsNFT>(
            &publisher,
            keys,
            values,
            ctx
        );
        
        // Update the Display object with additional fields if needed
        display::update_version(&mut display);
        
        // Transfer the Display object to the package publisher
        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
    }

    /// Helper function to create a full IPFS URL from a CID
    fun create_ipfs_url(cid: vector<u8>): url::Url {
        let mut full_url = string::utf8(DEFAULT_IPFS_GATEWAY);
        string::append(&mut full_url, string::utf8(cid));
        // Convert the string to bytes and use them to create the URL
        let bytes = *string::as_bytes(&full_url);
        url::new_unsafe_from_bytes(bytes)
    }

    /// Mint a new SheExcels NFT (admin only)
    public entry fun mint_nft(
        _: &AdminCap,
        recipient: address,
        name: vector<u8>,
        description: vector<u8>,
        event_date: vector<u8>,
        ctx: &mut tx_context::TxContext
    ) {
        let nft = SheExcelsNFT {
            id: object::new(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            image_url: create_ipfs_url(DEFAULT_IPFS_CID),
            event_date: string::utf8(event_date),
        };

        // Emit an event for the minting
        event::emit(NFTMinted {
            nft_id: object::id(&nft),
            recipient,
            event_name: nft.name,
        });

        // Transfer the NFT to the recipient
        transfer::transfer(nft, recipient);
    }

    /// Self-mint function for attendees to mint their own NFT
    public entry fun self_mint(
        name: vector<u8>,
        description: vector<u8>,
        event_date: vector<u8>,
        ctx: &mut tx_context::TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let nft = SheExcelsNFT {
            id: object::new(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            image_url: create_ipfs_url(DEFAULT_IPFS_CID),
            event_date: string::utf8(event_date),
        };

        // Emit an event for the minting
        event::emit(NFTMinted {
            nft_id: object::id(&nft),
            recipient: sender,
            event_name: nft.name,
        });

        // Transfer the NFT to the sender
        transfer::transfer(nft, sender);
    }

    /// Get the name of the NFT
    public fun name(nft: &SheExcelsNFT): &string::String {
        &nft.name
    }

    /// Get the description of the NFT
    public fun description(nft: &SheExcelsNFT): &string::String {
        &nft.description
    }

    /// Get the image URL of the NFT
    public fun image_url(nft: &SheExcelsNFT): &url::Url {
        &nft.image_url
    }

    /// Get the event date of the NFT
    public fun event_date(nft: &SheExcelsNFT): &string::String {
        &nft.event_date
    }
}
