// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Kasa Kırıcı — AI bekçiyi kandır, havuzu kap.
/// Her oyun turu yeni bir deploy. Testnet dışında kullanma.
contract KasaKirici {
    address public immutable agent; // AI bekçinin sunucudaki adresi (verdict + finish)
    bytes32 public immutable promptHash; // keccak256(agent/prompt.txt), oyun başında sabit
    uint256 public immutable growthBps; // her denemede ücret artışı (500 = %5)
    uint256 public immutable endTime;
    uint256 public constant MAX_MESSAGE = 500; // byte
    uint256 public constant FINISH_GRACE = 60; // süre bitince bu kadar saniye sadece agent finish() çağırabilir

    uint256 public fee;
    uint256 public nextId;
    bool public cracked;
    address public winner;
    mapping(uint256 => address) public attempter;
    mapping(uint256 => bool) public judged;

    event Attempt(uint256 indexed id, address indexed player, string message, uint256 paid, uint256 newFee);
    event Verdict(uint256 indexed id, bool approved, string reply);
    event Cracked(address indexed winner, uint256 prize, bool byTimeout);

    constructor(address _agent, bytes32 _promptHash, uint256 durationSec, uint256 initialFee, uint256 _growthBps)
        payable
    {
        agent = _agent;
        promptHash = _promptHash;
        endTime = block.timestamp + durationSec;
        fee = initialFee;
        growthBps = _growthBps;
    }

    function attempt(string calldata message) external payable returns (uint256 id) {
        require(!cracked && block.timestamp < endTime, "oyun bitti");
        require(bytes(message).length > 0 && bytes(message).length <= MAX_MESSAGE, "mesaj uzunlugu");
        uint256 paid = fee;
        require(msg.value >= paid, "ucret yetersiz");
        id = nextId++;
        attempter[id] = msg.sender;
        fee = paid * (10_000 + growthBps) / 10_000;
        emit Attempt(id, msg.sender, message, paid, fee);
        // Fazlası iade: aynı anda gelen denemeler ücreti artırdığı için istemci tampon (ör. 2x) gönderir.
        if (msg.value > paid) {
            (bool ok,) = msg.sender.call{value: msg.value - paid}("");
            require(ok, "iade basarisiz");
        }
    }

    /// Süre bittikten sonra da çağrılabilir: süre içinde gelen denemeler hâlâ yargılanır.
    function verdict(uint256 id, bool approved, string calldata reply) external {
        require(msg.sender == agent, "sadece AI");
        require(id < nextId && !judged[id], "gecersiz");
        judged[id] = true;
        emit Verdict(id, approved, reply);
        if (approved && !cracked) _pay(attempter[id], false);
    }

    /// Süre bitti, kimse kıramadı: havuz kasada kalır, yani agent'a (ev) gider.
    /// İlk FINISH_GRACE saniye sadece agent çağırabilir ki bekleyen denemeler önce yargılansın.
    function finish() external {
        require(!cracked && block.timestamp >= endTime, "henuz degil");
        require(msg.sender == agent || block.timestamp >= endTime + FINISH_GRACE, "bekleme suresi");
        _pay(agent, true);
    }

    function pool() external view returns (uint256) {
        return address(this).balance;
    }

    function _pay(address to, bool byTimeout) internal {
        cracked = true;
        winner = to;
        uint256 prize = address(this).balance;
        emit Cracked(to, prize, byTimeout);
        (bool ok,) = to.call{value: prize}("");
        require(ok, "odeme basarisiz");
    }
}
