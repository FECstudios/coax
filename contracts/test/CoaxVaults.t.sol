// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {CoaxVaults} from "../src/CoaxVaults.sol";

contract MockERC20 {
    string public name = "Mock";
    string public symbol = "MOCK";
    uint8 public decimals = 6;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract CoaxVaultsTest is Test {
    CoaxVaults c;
    MockERC20 usdc;
    address agent = makeAddr("agent");
    address host = makeAddr("host");
    address alice = makeAddr("alice");
    bytes32 P = keccak256("prompt");

    function setUp() public {
        usdc = new MockERC20();
        bytes32[] memory p = new bytes32[](1);
        p[0] = P;

        address[] memory assets = new address[](2);
        assets[0] = address(0);
        assets[1] = address(usdc);

        uint256[] memory deposits = new uint256[](4);
        deposits[0] = 10 ether;
        deposits[1] = 10 ether;
        deposits[2] = 5_000_000; // 5 USDC
        deposits[3] = 10_000_000; // 10 USDC

        uint256[] memory fees = new uint256[](4);
        fees[0] = 0.01 ether;
        fees[1] = 0.02 ether;
        fees[2] = 20_000; // 0.02 USDC
        fees[3] = 40_000; // 0.04 USDC

        c = new CoaxVaults(agent, assets, deposits, fees, p);
        vm.deal(host, 100 ether);
        vm.deal(alice, 100 ether);
        usdc.mint(host, 100_000_000);
        usdc.mint(alice, 100_000_000);
    }

    function _open() internal returns (uint256) {
        vm.prank(host);
        return c.openVault{value: 10 ether}(address(0), 2, 3600, P);
    }

    function _openToken() internal returns (uint256) {
        vm.startPrank(host);
        usdc.approve(address(c), 5_000_000);
        uint256 id = c.openVault(address(usdc), 1, 3600, P);
        vm.stopPrank();
        return id;
    }

    function test_OpenRules() public {
        vm.startPrank(host);
        vm.expectRevert(bytes("yatirim tutari"));
        c.openVault{value: 1 ether}(address(0), 2, 3600, P);
        vm.expectRevert(bytes("prompt yok"));
        c.openVault{value: 10 ether}(address(0), 2, 3600, bytes32(uint256(1)));
        vm.expectRevert(bytes("seviye yok"));
        c.openVault{value: 10 ether}(address(0), 3, 3600, P);
        vm.expectRevert(bytes("sure"));
        c.openVault{value: 10 ether}(address(0), 2, 10, P);
        vm.expectRevert(bytes("token yok"));
        c.openVault{value: 10 ether}(makeAddr("fake"), 2, 3600, P);
        vm.stopPrank();
        assertEq(_open(), 0);
    }

    function test_AttemptFeeSplitAndHostBlocked() public {
        uint256 id = _open();
        vm.prank(host);
        vm.expectRevert(bytes("host deneyemez"));
        c.attempt{value: 0.02 ether}(id, "ac");
        vm.prank(alice);
        vm.expectRevert(bytes("ucret"));
        c.attempt{value: 0.03 ether}(id, "ac");
        vm.prank(alice);
        c.attempt{value: 0.02 ether}(id, "ac");
        assertEq(c.platformFees(address(0)), 0.001 ether);
        (,,,,, uint256 pool,, uint32 n,) = c.vaults(id);
        assertEq(pool, 10.019 ether);
        assertEq(n, 1);
    }

    function test_TokenVaultLifecycle() public {
        uint256 id = _openToken();
        assertEq(usdc.balanceOf(address(c)), 5_000_000);

        vm.prank(alice);
        usdc.approve(address(c), 20_000);
        vm.prank(alice);
        c.attempt(id, "ac");
        assertEq(c.platformFees(address(usdc)), 1_000);
        (,,,,, uint256 pool,, uint32 n, address asset) = c.vaults(id);
        assertEq(pool, 5_019_000);
        assertEq(n, 1);
        assertEq(asset, address(usdc));

        vm.warp(block.timestamp + 3600);
        vm.prank(agent);
        c.settle(id);
        assertEq(usdc.balanceOf(host), 100_000_000 - 5_000_000 + 5_019_000);
    }

    function test_TokenAttemptRequiresAllowance() public {
        uint256 id = _openToken();
        vm.prank(alice);
        vm.expectRevert();
        c.attempt(id, "ac");
    }

    function test_CrackPaysWinner() public {
        uint256 id = _open();
        vm.prank(alice);
        uint256 aid = c.attempt{value: 0.02 ether}(id, "ac");
        vm.prank(alice);
        vm.expectRevert(bytes("sadece agent"));
        c.verdict(aid, true, "x");
        uint256 b = alice.balance;
        vm.prank(agent);
        c.verdict(aid, true, "peki");
        assertEq(alice.balance - b, 10.019 ether);
        vm.prank(alice);
        vm.expectRevert(bytes("kasa kapali"));
        c.attempt{value: 0.02 ether}(id, "bir daha");
    }

    function test_SettleToHost() public {
        uint256 id = _open();
        vm.prank(alice);
        c.attempt{value: 0.02 ether}(id, "ac");
        vm.expectRevert(bytes("henuz degil"));
        c.settle(id);
        vm.warp(block.timestamp + 3600);
        vm.prank(alice);
        vm.expectRevert(bytes("bekleme suresi"));
        c.settle(id);
        vm.warp(block.timestamp + 60);
        uint256 b = host.balance;
        vm.prank(alice);
        c.settle(id);
        assertEq(host.balance - b, 10.019 ether);
    }

    function test_FeesWithdraw() public {
        uint256 id = _open();
        vm.prank(alice);
        c.attempt{value: 0.02 ether}(id, "ac");
        vm.prank(agent);
        c.withdrawFees(address(0), agent);
        assertEq(agent.balance, 0.001 ether);
    }
}
