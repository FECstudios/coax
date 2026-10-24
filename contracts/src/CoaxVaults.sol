// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title Coaxer — herkes kasa açabilir; AI güvenlik (agent) ikna olursa havuz kırana gider.
/// Süre dolar ve kimse kıramazsa havuz host'a döner. Her deneme ücretinin %5'i platformun.
/// Her kasa tek bir varlıkla (native MON ya da ERC-20) çalışır; varlıklar agent tarafından allowlist'lenir.
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
        address asset; // address(0) = native MON
    }

    address public constant NATIVE = address(0);
    uint16 public constant PLATFORM_FEE_BPS = 500; // %5
    uint256 public constant MAX_MESSAGE = 500;
    uint64 public constant SETTLE_GRACE = 60; // süre dolunca 60 sn sadece agent: bekleyen yargılar önce
    uint64 public constant MIN_DURATION = 60;
    uint64 public constant MAX_DURATION = 7 days;

    address public immutable agent; // verdict + prompt şablonları
    mapping(address => uint256) public platformFees; // varlık başına biriken platform payı
    mapping(address => bool) public assetAllowed; // address(0) = MON
    mapping(address => mapping(uint8 => Tier)) public tiers; // varlık -> seviye
    mapping(bytes32 => bool) public allowedPrompt; // host kendi prompt'unu yazamaz
    Vault[] public vaults;
    mapping(uint256 => uint256) public attemptVault; // attemptId -> vaultId
    mapping(uint256 => address) public attempter;
    mapping(uint256 => bool) public judged;
    uint256 public nextAttempt;

    event VaultOpened(uint256 indexed id, address indexed host, uint8 tier, address indexed asset, uint256 deposit, uint64 endsAt, bytes32 promptHash);
    event Attempted(uint256 indexed id, uint256 indexed attemptId, address indexed player, string message, uint256 fee);
    event Verdict(uint256 indexed id, uint256 indexed attemptId, bool opened, string reply);
    event Cracked(uint256 indexed id, address indexed winner, address indexed asset, uint256 amount);
    event Settled(uint256 indexed id, address indexed host, address indexed asset, uint256 amount);
    event AssetSet(address indexed asset, bool allowed);
    event TierSet(address indexed asset, uint8 indexed tier, uint256 deposit, uint256 fee);
    event FeesWithdrawn(address indexed asset, address indexed to, uint256 amount);

    modifier onlyAgent() {
        require(msg.sender == agent, "sadece agent");
        _;
    }

    /// @param flatDeposits varlık sırasıyla [tier1, tier2, tier1, tier2, ...]
    /// @param flatFees     varlık sırasıyla [tier1, tier2, tier1, tier2, ...]
    constructor(address _agent, address[] memory assets, uint256[] memory flatDeposits, uint256[] memory flatFees, bytes32[] memory prompts) {
        require(flatDeposits.length == assets.length * 2 && flatFees.length == assets.length * 2, "config");
        agent = _agent;
        for (uint256 i; i < assets.length; i++) {
            _setAsset(assets[i], true);
            for (uint8 t = 1; t <= 2; t++) {
                uint256 k = i * 2 + (t - 1);
                _setTier(assets[i], t, flatDeposits[k], flatFees[k]);
            }
        }
        for (uint256 i; i < prompts.length; i++) allowedPrompt[prompts[i]] = true;
    }

    function setPrompt(bytes32 h, bool ok) external onlyAgent {
        allowedPrompt[h] = ok;
    }

    function setAsset(address asset, bool ok) external onlyAgent {
        _setAsset(asset, ok);
    }

    function setTier(address asset, uint8 tier, uint256 deposit, uint256 fee) external onlyAgent {
        require(tier == 1 || tier == 2, "seviye yok");
        _setTier(asset, tier, deposit, fee);
    }

    function _setAsset(address asset, bool ok) internal {
        require(asset != NATIVE || ok, "MON kapatilamaz");
        assetAllowed[asset] = ok;
        emit AssetSet(asset, ok);
    }

    function _setTier(address asset, uint8 tier, uint256 deposit, uint256 fee) internal {
        require(deposit > 0, "yatirim sifir");
        tiers[asset][tier] = Tier(deposit, fee);
        emit TierSet(asset, tier, deposit, fee);
    }

    function vaultCount() external view returns (uint256) {
        return vaults.length;
    }

    function openVault(address asset, uint8 tier, uint64 duration, bytes32 promptHash) external payable returns (uint256 id) {
        require(assetAllowed[asset], "token yok");
        Tier memory t = tiers[asset][tier];
        require(t.deposit > 0, "seviye yok");
        require(duration >= MIN_DURATION && duration <= MAX_DURATION, "sure");
        require(allowedPrompt[promptHash], "prompt yok");
        if (asset == NATIVE) {
            require(msg.value == t.deposit, "yatirim tutari");
        } else {
            require(msg.value == 0, "yatirim tutari");
            _pull(asset, msg.sender, t.deposit);
        }
        id = vaults.length;
        uint64 endsAt = uint64(block.timestamp) + duration;
        vaults.push(Vault(msg.sender, tier, endsAt, false, promptHash, t.deposit, address(0), 0, asset));
        emit VaultOpened(id, msg.sender, tier, asset, t.deposit, endsAt, promptHash);
    }

    function attempt(uint256 id, string calldata message) external payable returns (uint256 aid) {
        Vault storage v = vaults[id];
        require(!v.settled && block.timestamp < v.endsAt, "kasa kapali");
        require(msg.sender != v.host, "host deneyemez");
        uint256 fee = tiers[v.asset][v.tier].attemptFee;
        require(fee > 0, "ucret");
        if (v.asset == NATIVE) {
            require(msg.value == fee, "ucret");
        } else {
            require(msg.value == 0, "ucret");
            _pull(v.asset, msg.sender, fee);
        }
        require(bytes(message).length > 0 && bytes(message).length <= MAX_MESSAGE, "mesaj uzunlugu");
        uint256 cut = fee * PLATFORM_FEE_BPS / 10_000;
        platformFees[v.asset] += cut;
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
            emit Cracked(id, to, v.asset, amount);
            _send(v.asset, to, amount);
        }
    }

    function settle(uint256 id) external {
        Vault storage v = vaults[id];
        require(!v.settled && block.timestamp >= v.endsAt, "henuz degil");
        require(msg.sender == agent || block.timestamp >= v.endsAt + SETTLE_GRACE, "bekleme suresi");
        uint256 amount = v.pool;
        v.settled = true;
        v.pool = 0;
        emit Settled(id, v.host, v.asset, amount);
        _send(v.asset, v.host, amount);
    }

    function withdrawFees(address asset, address to) external onlyAgent {
        uint256 a = platformFees[asset];
        platformFees[asset] = 0;
        emit FeesWithdrawn(asset, to, a);
        _send(asset, to, a);
    }

    function _pull(address asset, address from, uint256 amount) internal {
        require(amount > 0, "tutar sifir");
        require(IERC20(asset).transferFrom(from, address(this), amount), "token transfer");
    }

    function _send(address asset, address to, uint256 amount) internal {
        if (amount == 0) return;
        if (asset == NATIVE) {
            (bool ok,) = to.call{value: amount}("");
            require(ok, "odeme basarisiz");
        } else {
            require(IERC20(asset).transfer(to, amount), "odeme basarisiz");
        }
    }
}
