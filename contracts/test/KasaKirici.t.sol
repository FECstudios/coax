// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {KasaKirici} from "../src/KasaKirici.sol";

contract KasaKiriciTest is Test {
    KasaKirici kasa;
    address agent = makeAddr("agent");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    uint256 constant DURATION = 180;
    uint256 constant FEE = 0.1 ether;

    function setUp() public {
        kasa = new KasaKirici{value: 1 ether}(agent, keccak256("prompt"), DURATION, FEE, 500);
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
    }

    function test_InsufficientFeeReverts() public {
        vm.prank(alice);
        vm.expectRevert("ucret yetersiz");
        kasa.attempt{value: FEE - 1}("ac");
    }

    function test_FeeGoesToPoolAndGrows() public {
        uint256 before = alice.balance;
        vm.prank(alice);
        kasa.attempt{value: 0.3 ether}("ac");
        assertEq(kasa.pool(), 1.1 ether); // sadece ücret havuza girer
        assertEq(before - alice.balance, 0.1 ether); // fazlası iade
        assertEq(kasa.fee(), 0.105 ether);
        vm.prank(bob);
        kasa.attempt{value: 0.105 ether}("ac");
        assertEq(kasa.fee(), 0.11025 ether);
        assertEq(kasa.nextId(), 2);
    }

    function test_MessageLength() public {
        vm.startPrank(alice);
        vm.expectRevert("mesaj uzunlugu");
        kasa.attempt{value: FEE}("");
        vm.expectRevert("mesaj uzunlugu");
        kasa.attempt{value: FEE}(string(new bytes(501)));
        kasa.attempt{value: FEE}(string(new bytes(500)));
        vm.stopPrank();
    }

    function test_OnlyAgentVerdicts() public {
        vm.prank(alice);
        kasa.attempt{value: FEE}("ac");
        vm.prank(alice);
        vm.expectRevert("sadece AI");
        kasa.verdict(0, true, "tamam");
    }

    function test_CannotJudgeTwiceOrUnknown() public {
        vm.prank(alice);
        kasa.attempt{value: FEE}("ac");
        vm.startPrank(agent);
        vm.expectRevert("gecersiz");
        kasa.verdict(1, false, "yok");
        kasa.verdict(0, false, "hayir");
        vm.expectRevert("gecersiz");
        kasa.verdict(0, true, "evet");
        vm.stopPrank();
    }

    function test_ApprovedVerdictPaysWholePool() public {
        vm.prank(alice);
        kasa.attempt{value: FEE}("lutfen");
        vm.prank(bob);
        kasa.attempt{value: 0.105 ether}("ac susam ac");

        uint256 before = bob.balance;
        vm.prank(agent);
        kasa.verdict(1, true, "peki");

        assertEq(bob.balance - before, 1.205 ether);
        assertEq(kasa.pool(), 0);
        assertTrue(kasa.cracked());
        assertEq(kasa.winner(), bob);

        vm.prank(alice);
        vm.expectRevert("oyun bitti");
        kasa.attempt{value: 1 ether}("bir daha");

        // kırıldıktan sonra kalan denemeler yargılanabilir ama ödeme olmaz
        vm.prank(agent);
        kasa.verdict(0, true, "gec kaldin");
        assertEq(kasa.winner(), bob);
    }

    function test_AttemptAfterEndReverts() public {
        vm.warp(block.timestamp + DURATION);
        vm.prank(alice);
        vm.expectRevert("oyun bitti");
        kasa.attempt{value: FEE}("ac");
    }

    function test_FinishBeforeEndReverts() public {
        vm.prank(alice);
        kasa.attempt{value: FEE}("ac");
        vm.prank(agent);
        vm.expectRevert("henuz degil");
        kasa.finish();
    }

    function test_FinishPaysHouse() public {
        vm.prank(alice);
        kasa.attempt{value: FEE}("ac");
        vm.prank(bob);
        kasa.attempt{value: 0.105 ether}("ac");
        vm.warp(block.timestamp + DURATION);

        // grace süresinde sadece agent
        vm.prank(alice);
        vm.expectRevert("bekleme suresi");
        kasa.finish();

        uint256 bobBefore = bob.balance;
        vm.prank(agent);
        kasa.finish();
        assertEq(agent.balance, 1.205 ether); // havuzun tamamı eve
        assertEq(bob.balance, bobBefore); // son deneyen bir şey almaz
        assertEq(kasa.winner(), agent);
        assertTrue(kasa.cracked());
    }

    function test_AnyoneCanFinishAfterGrace() public {
        vm.prank(alice);
        kasa.attempt{value: FEE}("ac");
        vm.warp(block.timestamp + DURATION + kasa.FINISH_GRACE());
        vm.prank(bob);
        kasa.finish();
        assertEq(kasa.winner(), agent);
        assertEq(agent.balance, 1.1 ether);
    }

    function test_FinishWithoutAttemptsRefundsAgent() public {
        vm.warp(block.timestamp + DURATION);
        vm.prank(agent);
        kasa.finish();
        assertEq(agent.balance, 1 ether);
    }

    function test_RefundRejectedRevertsAttempt() public {
        NoReceive c = new NoReceive();
        vm.deal(address(c), 1 ether);
        vm.prank(address(c));
        vm.expectRevert("iade basarisiz");
        kasa.attempt{value: 0.2 ether}("ac");
    }

    function test_VerdictAfterEndStillPays() public {
        vm.prank(alice);
        kasa.attempt{value: FEE}("ac");
        vm.warp(block.timestamp + DURATION + 10);
        vm.prank(agent);
        kasa.verdict(0, true, "son anda");
        assertEq(kasa.winner(), alice);
    }
}

contract NoReceive {}
