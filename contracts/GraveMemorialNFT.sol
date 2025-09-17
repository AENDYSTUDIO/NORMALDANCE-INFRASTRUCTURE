// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title GraveMemorialNFT
 * @dev G.rave - Digital Cemetery for Musicians
 * @author NORMAL DANCE Team
 * 
 * Simple and efficient memorial NFT contract for quick deployment
 */
contract GraveMemorialNFT is ERC721, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // Memorial structure - simplified for quick deployment
    struct Memorial {
        string ipfsHash;      // IPFS hash containing audio + photo + bio
        address[] heirs;      // Addresses that receive donations
        uint256 fundBalance;  // Current fund balance
        uint256 platformFee;  // Platform fee percentage (2%)
        string artistName;    // Artist name
        bool isActive;        // Memorial status
        uint256 createdAt;    // Creation timestamp
    }
    
    // Mappings
    mapping(uint256 => Memorial) public memorials;
    mapping(address => uint256[]) public userMemorials;
    mapping(string => uint256) public artistToMemorial;
    
    // Events
    event MemorialCreated(
        uint256 indexed tokenId, 
        address indexed creator, 
        string artistName,
        address[] heirs
    );
    
    event DonationReceived(
        uint256 indexed tokenId, 
        address indexed donor, 
        uint256 amount,
        string message
    );
    
    event FundDistributed(
        uint256 indexed tokenId,
        address indexed heir,
        uint256 amount
    );
    
    constructor() ERC721("GraveMemorial", "GRAVE") {
        // Set platform fee to 2%
    }
    
    /**
     * @dev Create a new memorial NFT
     * @param _ipfsHash IPFS hash containing memorial data
     * @param _heirs Array of heir addresses
     * @param _artistName Name of the artist
     */
    function createMemorial(
        string memory _ipfsHash,
        address[] memory _heirs,
        string memory _artistName
    ) public payable returns (uint256) {
        require(bytes(_ipfsHash).length > 0, "IPFS hash required");
        require(_heirs.length > 0, "At least one heir required");
        require(bytes(_artistName).length > 0, "Artist name required");
        require(artistToMemorial[_artistName] == 0, "Memorial already exists for this artist");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        // Create memorial
        memorials[tokenId] = Memorial({
            ipfsHash: _ipfsHash,
            heirs: _heirs,
            fundBalance: 0,
            platformFee: 2, // 2% platform fee
            artistName: _artistName,
            isActive: true,
            createdAt: block.timestamp
        });
        
        // Update mappings
        userMemorials[msg.sender].push(tokenId);
        artistToMemorial[_artistName] = tokenId;
        
        // Mint NFT to creator
        _safeMint(msg.sender, tokenId);
        
        emit MemorialCreated(tokenId, msg.sender, _artistName, _heirs);
        return tokenId;
    }
    
    /**
     * @dev Donate to a memorial fund
     * @param tokenId Memorial token ID
     * @param message Optional donation message
     */
    function donate(uint256 tokenId, string memory message) public payable nonReentrant {
        require(_exists(tokenId), "Memorial does not exist");
        require(msg.value > 0, "Donation amount must be greater than 0");
        require(memorials[tokenId].isActive, "Memorial is not active");
        
        Memorial storage mem = memorials[tokenId];
        
        // Calculate platform fee (2%)
        uint256 fee = (msg.value * mem.platformFee) / 100;
        uint256 donation = msg.value - fee;
        
        // Send platform fee to contract owner
        if (fee > 0) {
            payable(owner()).transfer(fee);
        }
        
        // Add donation to memorial fund
        mem.fundBalance += donation;
        
        emit DonationReceived(tokenId, msg.sender, donation, message);
    }
    
    /**
     * @dev Distribute memorial fund to heirs
     * @param tokenId Memorial token ID
     */
    function distributeToHeirs(uint256 tokenId) public nonReentrant {
        require(_exists(tokenId), "Memorial does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not memorial owner");
        
        Memorial storage mem = memorials[tokenId];
        require(mem.fundBalance > 0, "No funds to distribute");
        require(mem.heirs.length > 0, "No heirs specified");
        
        uint256 amountPerHeir = mem.fundBalance / mem.heirs.length;
        uint256 totalDistributed = 0;
        
        // Distribute to each heir
        for (uint256 i = 0; i < mem.heirs.length; i++) {
            if (mem.heirs[i] != address(0)) {
                payable(mem.heirs[i]).transfer(amountPerHeir);
                totalDistributed += amountPerHeir;
                emit FundDistributed(tokenId, mem.heirs[i], amountPerHeir);
            }
        }
        
        // Reset fund balance
        mem.fundBalance = 0;
    }
    
    /**
     * @dev Get memorial details
     * @param tokenId Memorial token ID
     */
    function getMemorial(uint256 tokenId) public view returns (Memorial memory) {
        require(_exists(tokenId), "Memorial does not exist");
        return memorials[tokenId];
    }
    
    /**
     * @dev Get user's memorials
     * @param user User address
     */
    function getUserMemorials(address user) public view returns (uint256[] memory) {
        return userMemorials[user];
    }
    
    /**
     * @dev Get memorial by artist name
     * @param artistName Artist name
     */
    function getMemorialByArtist(string memory artistName) public view returns (uint256) {
        return artistToMemorial[artistName];
    }
    
    /**
     * @dev Visit memorial (increment visitor count)
     * @param tokenId Memorial token ID
     */
    function visitMemorial(uint256 tokenId) public {
        require(_exists(tokenId), "Memorial does not exist");
        // Could add visitor tracking here if needed
    }
    
    /**
     * @dev Override tokenURI to return memorial metadata
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        
        Memorial memory mem = memorials[tokenId];
        
        return string(abi.encodePacked(
            '{"name":"', mem.artistName, ' Memorial",',
            '"description":"Digital memorial for ', mem.artistName, '",',
            '"image":"ipfs://', mem.ipfsHash, '/cover.jpg",',
            '"attributes":[',
            '{"trait_type":"Artist","value":"', mem.artistName, '"},',
            '{"trait_type":"Fund Balance","value":', _uint2str(mem.fundBalance), '},',
            '{"trait_type":"Heirs","value":', _uint2str(mem.heirs.length), '},',
            '{"trait_type":"Created","value":', _uint2str(mem.createdAt), '}',
            ']}'
        ));
    }
    
    /**
     * @dev Emergency withdraw (owner only)
     */
    function emergencyWithdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    /**
     * @dev Helper function to convert uint to string
     */
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}
