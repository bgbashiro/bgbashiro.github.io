// Hall of Fame and Leaderboard panels.
// Uses the Firebase helpers that firebaseconnect.js exposes on window.

const PILOT_FALLBACK = "unknown pilot";
let hofRequestId = 0;
let leaderboardRequestId = 0;

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function emptyRow(text) {
    return el("li", "empty", text);
}

// Resolve display names once per unique uuid for a single refresh.
function resolveNames(uuids) {
    const unique = [...new Set(uuids)];
    return Promise.all(unique.map(uuid => getUsername(uuid).catch(() => null)))
        .then(names => new Map(unique.map((uuid, i) => [uuid, names[i] || PILOT_FALLBACK])));
}

function refreshBalance() {
    const balanceEl = document.getElementById("gravicoinBalance");
    getCurrentUser(user => {
        const coins = user && user.graviCoins !== undefined ? user.graviCoins : 0;
        balanceEl.textContent = `Balance: ${coins}🪙`;
    });
}

function flashBalance() {
    const balanceEl = document.getElementById("gravicoinBalance");
    const previous = balanceEl.textContent;
    balanceEl.textContent = "Not enough coins… " + previous;
    setTimeout(() => { balanceEl.textContent = previous; }, 2000);
}

function updateHallOfFame() {
    const requestId = ++hofRequestId;
    fetchHOF()
        .then(async rows => {
            const names = await resolveNames(rows.map(row => row.uuid));
            if (requestId !== hofRequestId) return;

            const items = rows.map(({ uuid, message }) => {
                const li = el("li", "hof-entry" + (window.uuid === uuid ? " is-own" : ""));
                li.append(el("p", null, message), el("span", "hof-author", "— " + names.get(uuid)));
                return li;
            });
            document.querySelector("#halloffame > ol")
                .replaceChildren(...(items.length ? items : [emptyRow("No messages yet")]));
        })
        .catch(err => console.error("Hall of Fame failed:", err));
    refreshBalance();
}

function updateLeaderBoard(level) {
    const requestId = ++leaderboardRequestId;
    const panel = document.getElementById("leaderboard");
    panel.querySelector(".level-label").textContent = `Level ${level}`;

    fetchLeaderBoard(level)
        .then(async scores => {
            const ranked = Object.entries(scores).sort(([, a], [, b]) => b - a);
            const names = await resolveNames(ranked.map(([uuid]) => uuid));
            if (requestId !== leaderboardRequestId) return;

            const items = ranked.map(([uuid, score], i) => {
                const li = el("li", "lb-entry" + (window.uuid === uuid ? " is-own" : ""));
                li.append(
                    el("span", "lb-rank", String(i + 1)),
                    el("span", "lb-name", names.get(uuid)),
                    el("span", "lb-score", String(score))
                );
                return li;
            });
            panel.querySelector("ol")
                .replaceChildren(...(items.length ? items : [emptyRow("No scores yet")]));
        })
        .catch(err => console.error("Leaderboard failed:", err));
}

document.querySelector("form.halloffame-entry").addEventListener("submit", e => {
    e.preventDefault();
    const input = e.currentTarget.querySelector("input[type='text']");
    const message = input.value;
    if (message.length === 0) return;
    addHOFMessage(
        message,
        () => {
            input.value = "";
            updateHallOfFame();
        },
        flashBalance
    );
});
