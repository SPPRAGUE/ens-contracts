// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./BaseRegistrarImplementation.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RegistrarSecurityController
 * @notice Break-glass controller for the base registrar.
 * @dev Acts as a pass-through for the base registrar, but with the ability for
 *      security controllers to disable registrar controllers.
 */
contract RegistrarSecurityController is Ownable {
    bytes4 private constant INTERFACE_META_ID =
        bytes4(keccak256("supportsInterface(bytes4)"));

    /**
     * @notice Emitted when a security controller is added.
     * @param controller The security controller address.
     */
    event ControllerAdded(address indexed controller);
    /**
     * @notice Emitted when a security controller is removed.
     * @param controller The security controller address.
     */
    event ControllerRemoved(address indexed controller);

    /**
     * @notice Security controllers authorized to disable registrar controllers.
     * @dev These addresses can call `disableRegistrarController`.
     */
    mapping(address => bool) public controllers;

    /**
     * @notice The registrar this controller manages.
     */
    BaseRegistrarImplementation public registrar;

    /**
     * @dev Restricts actions to security controllers.
     */
    modifier onlyController() {
        require(controllers[msg.sender]);
        _;
    }

    /**
     * @param _registrar The base registrar to manage.
     */
    constructor(BaseRegistrarImplementation _registrar) {
        registrar = _registrar;
    }

    /**
     * @notice Authorizes a security controller.
     * @param controller The security controller address.
     */
    function addController(address controller) external onlyOwner {
        controllers[controller] = true;
        emit ControllerAdded(controller);
    }

    /**
     * @notice Revokes a security controller.
     * @param controller The security controller address.
     */
    function removeController(address controller) external onlyOwner {
        controllers[controller] = false;
        emit ControllerRemoved(controller);
    }

    /**
     * @notice Grants registrar controller permissions.
     * @param controller The registrar controller to add.
     */
    function addRegistrarController(address controller) external onlyOwner {
        registrar.addController(controller);
    }

    /**
     * @notice Revokes registrar controller permissions.
     * @param controller The registrar controller to remove.
     */
    function removeRegistrarController(address controller) external onlyOwner {
        registrar.removeController(controller);
    }

    /**
     * @notice Sets the registrar's resolver for the base node.
     * @param resolver The resolver address to set.
     */
    function setRegistrarResolver(address resolver) external onlyOwner {
        registrar.setResolver(resolver);
    }

    /**
     * @notice Transfers ownership of the registrar.
     * @param newOwner The new owner for the registrar.
     */
    function transferRegistrarOwnership(address newOwner) public virtual onlyOwner {
        registrar.transferOwnership(newOwner);
    }

    /**
     * @notice Removes a registrar controller in emergencies.
     * @dev Callable only by security controllers.
     * @param controller The registrar controller to remove.
     */
    function disableRegistrarController(address controller) external onlyController {
        registrar.removeController(controller);
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
