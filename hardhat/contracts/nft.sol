// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract TaikoNFT is ERC721Enumerable, Ownable {
    string private _baseTokenURI;
    uint256 private _tokenCounter;

    constructor() ERC721("Taiko", "TAI") {
        _baseTokenURI = "https://gateway.pinata.cloud/ipfs/QmfRntAVjMJr2Sfqz1TS9C4MM4myjtFY2Puuhkb9LkRDRL/";
        _tokenCounter = 1; // Start counter at 1
    }

    // Function to mint a new NFT
    function mint(address _to) external {
        uint256 tokenId = _tokenCounter; // Get the current token ID
        _safeMint(_to, tokenId); // Mint the NFT to the caller
        _tokenCounter++; // Increment the counter after minting
    }

    // Override to return the full token URI
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        return
            string(
                abi.encodePacked(
                    _baseTokenURI,
                    Strings.toString(tokenId),
                    ".png"
                )
            ); // Construct token URI
    }

    // Function to set a new base URI (only owner)
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }

    // Function to get the current counter
    function getCurrentCounter() external view returns (uint256) {
        return _tokenCounter;
    }

    // Function to get all token IDs owned by an address
    function tokensOfOwner(
        address owner
    ) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        return tokenIds;
    }
}
