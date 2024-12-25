import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "frog/jsx/jsx-runtime";
import { serveStatic } from "@hono/node-server/serve-static";
import { Button, Frog } from "frog";
import { devtools } from "frog/dev";
import { neynar } from "frog/middlewares";
// تعریف اپلیکیشن Frog
export const app = new Frog({
    title: "Degen State",
    imageAspectRatio: "1:1",
    imageOptions: {
        fonts: [
            {
                name: "Lilita One",
                weight: 400,
                source: "google", // بارگذاری فونت از Google Fonts
            },
        ],
    },
})
    .use(neynar({
    apiKey: "NEYNAR_FROG_FM", // کلید API برای Neynar
    features: ["interactor", "cast"], // فعال کردن ویژگی‌های موردنیاز
}))
    .use("/*", serveStatic({ root: "./public" }));
// درخواست اطلاعات از API Points
async function fetchUserPoints(fid, season = "current") {
    const apiUrl = `https://api.degen.tips/airdrop2/${season}/points?fid=${fid.toString()}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            console.error(`API Error: ${response.status} ${response.statusText}`);
            return null;
        }
        const data = await response.json();
        console.log(`User Points Data for FID ${fid}:`, data);
        return data;
    }
    catch (error) {
        console.error("Error fetching user points:", error);
        return null;
    }
}
// درخواست اطلاعات از API Allowances
async function fetchUserAllowances(fid) {
    const apiUrl = `https://api.degen.tips/airdrop2/allowances?fid=${fid.toString()}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            console.error(`API Error: ${response.status} ${response.statusText}`);
            return null;
        }
        const data = await response.json();
        console.log("Fetched Points Data:", JSON.stringify(data, null, 2));
        // مرتب‌سازی داده‌ها بر اساس تاریخ (به صورت نزولی)
        const sortedData = data.sort((a, b) => new Date(b.snapshot_day).getTime() - new Date(a.snapshot_day).getTime());
        // انتخاب روز آخر
        const lastDay = sortedData[0];
        if (lastDay) {
            console.log(`Last Allowances for FID ${fid}:`, `Date: ${lastDay.snapshot_day}, Tip Allowance: ${lastDay.tip_allowance}, Remaining Tip Allowance: ${lastDay.remaining_tip_allowance}`);
            console.log("Last Snapshot Date:", sortedData[0]?.snapshot_day);
        }
        return lastDay; // بازگشت روز آخر
    }
    catch (error) {
        console.error("Error fetching user allowances:", error);
        return null;
    }
}
// نمایش تنها صفحه دوم
app.frame("/", async (c) => {
    const params = new URLSearchParams(c.req.url.split("?")[1]);
    const fid = params.get("fid") || c.var.interactor?.fid || "FID Not Available";
    const username = params.get("username") || c.var.interactor?.username || "Username Not Available";
    const pfpUrl = params.get("pfpUrl") || c.var.interactor?.pfpUrl || "";
    let points = null;
    let lastTipAllowance = null;
    const page2Url = `https://5027-79-127-240-45.ngrok-free.app?fid=${encodeURIComponent(fid)}&username=${encodeURIComponent(username)}&pfpUrl=${encodeURIComponent(pfpUrl)}`;
    // لینک اصلی کست
    const composeCastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent("Check Your Degen State\n\nFrame By @jeyloo")}&embeds[]=${encodeURIComponent(page2Url)}`;
    // دریافت اطلاعات Points و Allowances
    if (fid !== "FID Not Available") {
        const pointsData = await fetchUserPoints(fid);
        if (Array.isArray(pointsData) && pointsData.length > 0) {
            points = pointsData[0].points;
        }
        else {
            points = "No Points Available";
        }
        const lastAllowance = await fetchUserAllowances(fid);
        if (lastAllowance) {
            const tipped = parseFloat(lastAllowance.tip_allowance) - parseFloat(lastAllowance.remaining_tip_allowance);
            lastTipAllowance = {
                date: lastAllowance.snapshot_day,
                tip_allowance: lastAllowance.tip_allowance,
                remaining_tip_allowance: lastAllowance.remaining_tip_allowance,
                tipped: Math.round(tipped).toString(),
            };
        }
    }
    return c.res({
        image: (_jsxs("div", { style: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "100%",
                backgroundColor: "black",
                color: "white",
                fontSize: "20px",
                fontFamily: "'Lilita One'",
            }, children: [_jsx("img", { src: "https://i.imgur.com/XznXt9o.png", alt: "Frog Frame - Page 2", style: {
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                    } }), pfpUrl && (_jsx("img", { src: pfpUrl, alt: "Profile Picture", style: {
                        width: "230px",
                        height: "230px",
                        borderRadius: "50%",
                        position: "absolute",
                        top: "21%",
                        left: "35%",
                        transform: "translate(-50%, -50%)",
                        border: "3px solid white",
                    } })), _jsx("p", { style: {
                        color: "cyan",
                        fontSize: "50px",
                        fontWeight: "700",
                        position: "absolute",
                        top: "10%",
                        left: "55.5%",
                        transform: "translate(-50%, -50%)",
                    }, children: username }), _jsx("p", { style: {
                        color: "yellow",
                        fontSize: "18px",
                        fontWeight: "500",
                        position: "absolute",
                        top: "20%",
                        left: "55.5%",
                        transform: "translate(-50%, -50%)",
                    }, children: fid }), _jsx("p", { style: {
                        color: points === "N/A" ? "red" : "purple",
                        fontSize: "45px",
                        fontWeight: "1100",
                        position: "absolute",
                        top: "37%",
                        left: "67%",
                        transform: "translate(-50%, -50%) rotate(15deg)",
                    }, children: points || "No Points Available" }), lastTipAllowance && (_jsxs(_Fragment, { children: [_jsx("p", { style: {
                                color: "yellow",
                                fontSize: "45px",
                                fontWeight: "700",
                                position: "absolute",
                                top: "48%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                            }, children: `${lastTipAllowance.tip_allowance}` }), _jsx("p", { style: {
                                color: "lime",
                                fontSize: "45px",
                                fontWeight: "700",
                                position: "absolute",
                                top: "68%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                            }, children: `${lastTipAllowance.remaining_tip_allowance}` }), _jsx("p", { style: {
                                color: "darkred",
                                fontSize: "45px",
                                fontWeight: "700",
                                position: "absolute",
                                top: "85%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                            }, children: `${lastTipAllowance.tipped}` })] }))] })),
        intents: [
            _jsx(Button, { value: "page2", children: "My State" }), // دکمه My State
            _jsx(Button.Link, { href: composeCastUrl, children: "Share" }),
        ],
    });
});
// ابزارهای توسعه
devtools(app, { serveStatic });
