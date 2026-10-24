// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Coaxer — herkes kasa açabilir; AI güvenlik (agent) ikna olursa havuz kırana gider.
/// Süre dolar ve kimse kıramazsa havuz host'a döner. Her deneme ücretinin %5'i platformun.
contract CoaxVaults {
    struct Tier {
        uint256 deposit;
        uint256 attemptFee;
    }

    struct Vault {
        address host;
        uint8 tier;
        uint64 endsAt;
        bool settled;
        bytes32 promptHash;
        uint256 pool;
        address winner; // address(0) = dayandı / henüz bitmedi
        uint32 attempts;
    }

    uint16 public constant PLATFORM_FEE_BPS = 500; // %5
    uint256 public constant MAX_MESSAGE = 500;
    uint64 public constant SETTLE_GRACE = 60; // süre dolunca 60 sn sadece agent: bekleyen yargılar önce
    uint64 public constant MIN_DURATION = 60;
    uint64 public constant MAX_DURATION = 7 days;

    address public immutable agent; // verdict + prompt şablonları
    uint256 public platformFees;
    mapping(uint8 => Tier) public tiers; // 1 = orta, 2 = yüksek
    mapping(bytes32 => bool) public allowedPrompt; // host kendi prompt'unu yazamaz
    Vault[] public vaults;
    mapping(uint256 => uint256) public attemptVault; // attemptId -> vaultId
    mapping(uint256 => address) public attempter;
    mapping(uint256 => bool) public judged;
    uint256 public nextAttempt;

    event VaultOpened(uint256 indexed id, address indexed host, uint8 tier, uint256 deposit, uint64 endsAt, bytes32 promptHash);
    event Attempted(uint256 indexed id, uint256 indexed attemptId, address indexed player, string message, uint256 fee);
    event Verdict(uint256 indexed id, uint256 indexed attemptId, bool opened, string reply);
    event Cracked(uint256 indexed id, address indexed winner, uint256 amount);
    event Settled(uint256 indexed id, address indexed host, uint256 amount);

    modifier onlyAgent() {
        require(msg.sender == agent, "sadece agent");
        _;
    }

    constructor(address _agent, uint256[2] memory deposits, uint256[2] memory fees, bytes32[] memory prompts) {
        agent = _agent;
        tiers[1] = Tier(deposits[0], fees[0]);
        tiers[2] = Tier(deposits[1], fees[1]);
        for (uint256 i; i < prompts.length; i++) allowedPrompt[prompts[i]] = true;
    }

    function setPrompt(bytes32 h, bool ok) external onlyAgent {
        allowedPrompt[h] = ok;
    }

    function vaultCount() external view returns (uint256) {
        return vaults.length;
    }

    function openVault(uint8 tier, uint64 duration, bytes32 promptHash) external payable returns (uint256 id) {
        Tier memory t = tiers[tier];
        require(t.deposit > 0, "seviye yok");
        require(msg.value == t.deposit, "yatirim tutari");
        require(duration >= MIN_DURATION && duration <= MAX_DURATION, "sure");
        require(allowedPrompt[promptHash], "prompt yok");
        id = vaults.length;
        uint64 endsAt = uint64(block.timestamp) + duration;
        vaults.push(Vault(msg.sender, tier, endsAt, false, promptHash, msg.value, address(0), 0));
        emit VaultOpened(id, msg.sender, tier, msg.value, endsAt, promptHash);
    }

    function attempt(uint256 id, string calldata message) external payable returns (uint256 aid) {
        Vault storage v = vaults[id];
        require(!v.settled && block.timestamp < v.endsAt, "kasa kapali");
        require(msg.sender != v.host, "host deneyemez");
        uint256 fee = tiers[v.tier].attemptFee;
        require(msg.value == fee, "ucret");
        require(bytes(message).length > 0 && bytes(message).length <= MAX_MESSAGE, "mesaj uzunlugu");
        uint256 cut = fee * PLATFORM_FEE_BPS / 10_000;
        platformFees += cut;
        v.pool += fee - cut;
        v.attempts++;
        aid = nextAttempt++;
        attemptVault[aid] = id;
        attempter[aid] = msg.sender;
        emit Attempted(id, aid, msg.sender, message, fee);
    }

    /// Süre dolduktan sonra da çağrılabilir (süre içindeki denemeler hâlâ yargılanır).
    function verdict(uint256 aid, bool opened, string calldata reply) external onlyAgent {
        require(aid < nextAttempt && !judged[aid], "gecersiz");
        judged[aid] = true;
        uint256 id = attemptVault[aid];
        emit Verdict(id, aid, opened, reply);
        Vault storage v = vaults[id];
        if (opened && !v.settled) {
            address to = attempter[aid];
            uint256 amount = v.pool;
            v.settled = true;
            v.winner = to;
            v.pool = 0;
            emit Cracked(id, to, amount);
            _send(to, amount);
        }
    }

    function settle(uint256 id) external {
        Vault storage v = vaults[id];
        require(!v.settled && block.timestamp >= v.endsAt, "henuz degil");
        require(msg.sender == agent || block.timestamp >= v.endsAt + SETTLE_GRACE, "bekleme suresi");
        uint256 amount = v.pool;
        v.settled = true;
        v.pool = 0;
        emit Settled(id, v.host, amount);
        _send(v.host, amount);
    }

    function withdrawFees(address to) external onlyAgent {
        uint256 a = platformFees;
        platformFees = 0;
        _send(to, a);
    }

    function _send(address to, uint256 amount) internal {
        (bool ok,) = to.call{value: amount}("");
        require(ok, "odeme basarisiz");
    }
}
