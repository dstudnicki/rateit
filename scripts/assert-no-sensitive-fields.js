const BASE = process.env.BASE_URL || "http://localhost:3000";
const endpoints = ["/api/posts", "/api/companies"];
const bannedKeys = new Set(["userId", "createdBy", "user"]);

function findKeys(obj, path = "") {
    const found = [];
    if (Array.isArray(obj)) {
        obj.forEach((v, i) => {
            found.push(...findKeys(v, `${path}[${i}]`));
        });
    } else if (obj && typeof obj === "object") {
        for (const k of Object.keys(obj)) {
            if (bannedKeys.has(k)) found.push(`${path}.${k}`);
            found.push(...findKeys(obj[k], `${path}.${k}`));
        }
    }
    return found;
}

(async () => {
    let hasError = false;
    for (const ep of endpoints) {
        const url = `${BASE}${ep}`;
        console.log("Checking", url);
        try {
            const res = await fetch(url);
            const json = await res.json();
            const keys = findKeys(json, ep);
            if (keys.length > 0) {
                console.error("Found banned keys in", url, keys.slice(0, 10));
                hasError = true;
            } else {
                console.log("OK", url);
            }
        } catch (e) {
            console.error("Error fetching", url, e.message);
            hasError = true;
        }
    }

    if (hasError) process.exit(1);
    process.exit(0);
})();
