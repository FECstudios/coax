// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {CoaxVaults} from "../src/CoaxVaults.sol";

contract CoaxVaultsTest is Test {
    CoaxVaults c;
    address agent = makeAddr("agent");
    address host = makeAddr("host");
    address alice = makeAddr("alice");
    bytes32 P = keccak256("prompt");

    function setUp() public {
        bytes32[] memory p = new bytes32[](1);
        p[0] = P;
        c = new CoaxVaults(agent, [uint256(5 ether), 10 ether], [uint256(0.01 ether), 0.02 ether], p);
        vm.deal(host, 100 ether);
        vm.deal(alice, 100 ether);
    }

    function _open() internal returns (uint256) {
        vm.prank(host);
        return c.openVault{value: 10 ether}(2, 3600, P);
    }

    function test_OpenRules() public {
        vm.startPrank(host);
        vm.expectRevert(bytes("yatirim tutari"));
        c.openVault{value: 1 ether}(2, 3600, P);
        vm.expectRevert(bytes("prompt yok"));
        c.openVault{value: 10 ether}(2, 3600, bytes32(uint256(1)));
        vm.expectRevert(bytes("seviye yok"));
        c.openVault{value: 10 ether}(3, 3600, P);
        vm.expectRevert(bytes("sure"));
        c.openVault{value: 10 ether}(2, 10, P);
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
        assertEq(c.platformFees(), 0.001 ether);
        (,,,,, uint256 pool,, uint32 n) = c.vaults(id);
        assertEq(pool, 10.019 ether);
        assertEq(n, 1);
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
        c.withdrawFees(agent);
        assertEq(agent.balance, 0.001 ether);
    }
}
