import hre from 'hardhat'
import { labelhash, namehash, zeroHash } from 'viem'

import { getAccounts } from '../fixtures/utils.js'

const connection = await hre.network.connect()
const accounts = await getAccounts(connection)

async function fixture() {
  const ensRegistry = await connection.viem.deployContract('ENSRegistry', [])
  const baseRegistrar = await connection.viem.deployContract(
    'BaseRegistrarImplementation',
    [ensRegistry.address, namehash('eth')],
  )
  const registrarSecurityController = await connection.viem.deployContract(
    'RegistrarSecurityController',
    [baseRegistrar.address],
  )

  await ensRegistry.write.setSubnodeOwner([
    zeroHash,
    labelhash('eth'),
    baseRegistrar.address,
  ])
  await baseRegistrar.write.transferOwnership([
    registrarSecurityController.address,
  ])

  return {
    ensRegistry,
    baseRegistrar,
    registrarSecurityController,
  }
}
const loadFixture = async () => connection.networkHelpers.loadFixture(fixture)

describe('RegistrarSecurityController', () => {
  it('initializes registrar reference', async () => {
    const { baseRegistrar, registrarSecurityController } = await loadFixture()
    await expect(
      registrarSecurityController.read.registrar(),
    ).resolves.toEqualAddress(baseRegistrar.address)
  })

  describe('disableRegistrarController', () => {
    it('should remove controller access', async () => {
      const { baseRegistrar, registrarSecurityController } =
        await loadFixture()
      const controller = accounts[1].address
      const securityController = accounts[2]

      await registrarSecurityController.write.addRegistrarController([
        controller,
      ])
      await registrarSecurityController.write.addController([
        securityController.address,
      ])

      await expect(
        baseRegistrar.read.controllers([controller]),
      ).resolves.toEqual(true)

      await registrarSecurityController.write.disableRegistrarController(
        [controller],
        { account: securityController },
      )

      await expect(
        baseRegistrar.read.controllers([controller]),
      ).resolves.toEqual(false)
    })

    it('should revert when called by non-controller', async () => {
      const { registrarSecurityController } = await loadFixture()
      await expect(
        registrarSecurityController.write.disableRegistrarController(
          [accounts[1].address],
          { account: accounts[1] },
        ),
      ).toBeRevertedWithoutReason()
    })
  })

  describe('addController', () => {
    it('should add controller access', async () => {
      const { registrarSecurityController } = await loadFixture()
      const controller = accounts[1].address

      await registrarSecurityController.write.addController([controller])

      await expect(
        registrarSecurityController.read.controllers([controller]),
      ).resolves.toEqual(true)
    })

    it('should revert when called by non-owner', async () => {
      const { registrarSecurityController } = await loadFixture()
      await expect(
        registrarSecurityController.write.addController(
          [accounts[1].address],
          { account: accounts[1] },
        ),
      ).toBeRevertedWithString('Ownable: caller is not the owner')
    })
  })

  describe('removeController', () => {
    it('should remove controller access', async () => {
      const { registrarSecurityController } = await loadFixture()
      const controller = accounts[1].address

      await registrarSecurityController.write.addController([controller])

      await expect(
        registrarSecurityController.read.controllers([controller]),
      ).resolves.toEqual(true)

      await registrarSecurityController.write.removeController([controller])

      await expect(
        registrarSecurityController.read.controllers([controller]),
      ).resolves.toEqual(false)
    })

    it('should revert when called by non-owner', async () => {
      const { registrarSecurityController } = await loadFixture()
      await expect(
        registrarSecurityController.write.removeController(
          [accounts[1].address],
          { account: accounts[1] },
        ),
      ).toBeRevertedWithString('Ownable: caller is not the owner')
    })
  })

  describe('setRegistrarResolver', () => {
    it('should set the resolver for the base node', async () => {
      const { ensRegistry, registrarSecurityController } = await loadFixture()
      const resolver = accounts[1].address

      await registrarSecurityController.write.setRegistrarResolver([resolver])

      await expect(
        ensRegistry.read.resolver([namehash('eth')]),
      ).resolves.toEqualAddress(resolver)
    })

    it('should revert when called by non-owner', async () => {
      const { registrarSecurityController } = await loadFixture()
      await expect(
        registrarSecurityController.write.setRegistrarResolver(
          [accounts[1].address],
          { account: accounts[1] },
        ),
      ).toBeRevertedWithString('Ownable: caller is not the owner')
    })
  })

  describe('addRegistrarController', () => {
    it('should add registrar controller access', async () => {
      const { baseRegistrar, registrarSecurityController } = await loadFixture()
      const controller = accounts[1].address

      await registrarSecurityController.write.addRegistrarController([
        controller,
      ])

      await expect(
        baseRegistrar.read.controllers([controller]),
      ).resolves.toEqual(true)
    })

    it('should revert when called by non-owner', async () => {
      const { registrarSecurityController } = await loadFixture()
      await expect(
        registrarSecurityController.write.addRegistrarController(
          [accounts[1].address],
          { account: accounts[1] },
        ),
      ).toBeRevertedWithString('Ownable: caller is not the owner')
    })
  })

  describe('removeRegistrarController', () => {
    it('should remove registrar controller access', async () => {
      const { baseRegistrar, registrarSecurityController } = await loadFixture()
      const controller = accounts[1].address

      await registrarSecurityController.write.addRegistrarController([
        controller,
      ])
      await registrarSecurityController.write.removeRegistrarController([
        controller,
      ])

      await expect(
        baseRegistrar.read.controllers([controller]),
      ).resolves.toEqual(false)
    })

    it('should revert when called by non-owner', async () => {
      const { registrarSecurityController } = await loadFixture()
      await expect(
        registrarSecurityController.write.removeRegistrarController(
          [accounts[1].address],
          { account: accounts[1] },
        ),
      ).toBeRevertedWithString('Ownable: caller is not the owner')
    })
  })

  describe('transferRegistrarOwnership', () => {
    it('should transfer registrar ownership', async () => {
      const { baseRegistrar, registrarSecurityController } = await loadFixture()
      const newOwner = accounts[1].address
      await registrarSecurityController.write.transferRegistrarOwnership([
        newOwner,
      ])

      await expect(baseRegistrar.read.owner()).resolves.toEqualAddress(newOwner)
    })

    it('should revert when called by non-owner', async () => {
      const { registrarSecurityController } = await loadFixture()
      await expect(
        registrarSecurityController.write.transferRegistrarOwnership(
          [accounts[1].address],
          {
            account: accounts[1],
          },
        ),
      ).toBeRevertedWithString('Ownable: caller is not the owner')
    })
  })

  describe('supportsInterface', () => {
    it('should support ERC165', async () => {
      const { registrarSecurityController } = await loadFixture()

      await expect(
        registrarSecurityController.read.supportsInterface(['0x01ffc9a7']),
      ).resolves.toEqual(true)
    })

    it('should return false for unknown interface', async () => {
      const { registrarSecurityController } = await loadFixture()

      await expect(
        registrarSecurityController.read.supportsInterface(['0xffffffff']),
      ).resolves.toEqual(false)
    })
  })
})
