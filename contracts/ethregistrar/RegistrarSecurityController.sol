pragma solidity ^0.8.4;

import "./BaseRegistrarImplementation.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RegistrarSecurityController is Ownable {
    bytes4 private constant INTERFACE_META_ID =
        bytes4(keccak256("supportsInterface(bytes4)"));

    event ControllerAdded(address indexed controller);
    event ControllerRemoved(address indexed controller);

    // A map of addresses that are authorised to call `disableRegistrarController`.
    mapping(address => bool) public controllers;

    BaseRegistrarImplementation public registrar;

    modifier onlyController() {
        require(controllers[msg.sender]);
        _;
    }

    constructor(BaseRegistrarImplementation _registrar) {
        registrar = _registrar;
    }

    // Authorises a controller, who can register and renew domains.
    function addController(address controller) external onlyOwner {
        controllers[controller] = true;
        emit ControllerAdded(controller);
    }

    // Revoke controller permission for an address.
    function removeController(address controller) external onlyOwner {
        controllers[controller] = false;
        emit ControllerRemoved(controller);
    }

    function addRegistrarController(address controller) external onlyOwner {
        registrar.addController(controller);
    }

    function removeRegistrarController(address controller) external onlyOwner {
        registrar.removeController(controller);
    }

    function setRegistrarResolver(address resolver) external onlyOwner {
        registrar.setResolver(resolver);
    }

    function transferRegistrarOwnership(address newOwner) public virtual onlyOwner {
        registrar.transferOwnership(newOwner);
    }

    function disableRegistrarController(address controller) external onlyController {
        registrar.removeController(controller);
    }

    function supportsInterface(
        bytes4 interfaceID
    ) external pure returns (bool) {
        return interfaceID == INTERFACE_META_ID;
    }
}
