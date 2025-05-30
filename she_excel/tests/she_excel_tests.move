#[test_only]
module she_excel::she_excel_tests {
    use sui::test_scenario::{Self as ts};
    use std::string;
    use she_excel::she_excel::{Self, AdminCap, SheExcelsNFT};

    // Test addresses
    const ADMIN: address = @0xAD;
    const USER: address = @0xB0B;

    // Test data
    const EVENT_NAME: vector<u8> = b"SheExcels Daily Event";
    const EVENT_DESCRIPTION: vector<u8> = b"Proof of participation in the SheExcels onboarding event for women on Sui";
    const EVENT_DATE: vector<u8> = b"2025-05-30";

    #[test]
    fun test_admin_mint() {
        // Create a test scenario with the admin
        let mut scenario = ts::begin(ADMIN);
        
        // First transaction: publish the module, which creates the AdminCap
        {
            ts::next_tx(&mut scenario, ADMIN);
            // Module is published and AdminCap is created in the init function
        };

        // Second transaction: admin mints an NFT for a user
        {
            ts::next_tx(&mut scenario, ADMIN);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
            
            // Admin mints NFT for USER
            she_excel::mint_nft(
                &admin_cap,
                USER,
                EVENT_NAME,
                EVENT_DESCRIPTION,
                EVENT_DATE,
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, admin_cap);
        };

        // Third transaction: check that USER received the NFT
        {
            ts::next_tx(&mut scenario, USER);
            let nft = ts::take_from_sender<SheExcelsNFT>(&scenario);
            
            // Verify NFT properties
            assert!(*she_excel::name(&nft) == string::utf8(EVENT_NAME), 0);
            assert!(*she_excel::description(&nft) == string::utf8(EVENT_DESCRIPTION), 1);
            assert!(*she_excel::event_date(&nft) == string::utf8(EVENT_DATE), 2);
            
            ts::return_to_sender(&scenario, nft);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_self_mint() {
        // Create a test scenario with a user
        let mut scenario = ts::begin(USER);
        
        // User self-mints an NFT
        {
            ts::next_tx(&mut scenario, USER);
            
            she_excel::self_mint(
                EVENT_NAME,
                EVENT_DESCRIPTION,
                EVENT_DATE,
                ts::ctx(&mut scenario)
            );
        };

        // Check that the user received the NFT
        {
            ts::next_tx(&mut scenario, USER);
            let nft = ts::take_from_sender<SheExcelsNFT>(&scenario);
            
            // Verify NFT properties
            assert!(*she_excel::name(&nft) == string::utf8(EVENT_NAME), 0);
            assert!(*she_excel::description(&nft) == string::utf8(EVENT_DESCRIPTION), 1);
            assert!(*she_excel::event_date(&nft) == string::utf8(EVENT_DATE), 2);
            
            ts::return_to_sender(&scenario, nft);
        };

        ts::end(scenario);
    }
}
