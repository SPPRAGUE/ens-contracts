// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./Root.sol";
import "../registry/ENS.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RootSecurityController
 * @notice Break-glass controller for ENS root operations.
 * @dev Ownable contract that can disable a TLD and clear its resolver in
 *      emergencies.
 */
contract RootSecurityController is Ownable {
    bytes32 private constant ROOT_NODE = bytes32(0);
    bytes4 private constant INTERFACE_META_ID =
        bytes4(keccak256("supportsInterface(bytes4)"));

    /**
     * @notice The root contract.
     */
    Root public root;
    /**
     * @notice The ENS registry.
     */
    ENS public ens;

    /**
     * @param _root The root contract to manage.
     */
    constructor(Root _root) {
        root = _root;
        ens = _root.ens();
    }

    /**
     * @notice Takes ownership of a TLD and clears its resolver.
     * @param label The labelhash of the TLD to disable.
     */
    function disableTLD(bytes32 label) external onlyOwner {
        root.setSubnodeOwner(label, address(this));
        ens.setResolver(keccak256(abi.encodePacked(ROOT_NODE, label)), address(0));
    }

    /**
     * @notice ERC165 support for this controller.
     * @param interfaceID The interface identifier to check.
     * @return True if the interface is supported.
     */
    function supportsInterface(
        bytes4 interfaceID
    ) external pure returns (bool) {
        return interfaceID == INTERFACE_META_ID;
    }
}
