import { createServer } from "http";
import { serveStatic } from "@hono/node-server/serve-static";
import { Button, Frog } from "frog";
import { neynar } from "frog/middlewares";
import { Readable } from "stream";

// تابع کمکی برای تبدیل `IncomingMessage` به `Request`
const toFetchRequest = (req: any): Request => {
  const url = `http://${req.headers.host}${req.url}`;
  const headers = new Headers(req.headers as any);
  const body =
    req.method === "GET" || req.method === "HEAD"
      ? null
      : Readable.toWeb(req) as any;
  return new Request(url, { method: req.method, headers, body });
};

// تعریف اپلیکیشن Frog
const app = new Frog({
  title: "Degen State",
  imageAspectRatio: "1:1",
})
  .use(
    neynar({
      apiKey: "NEYNAR_FROG_FM",
      features: ["interactor", "cast"],
    })
  )
  .use("/*", serveStatic({ root: "./public" }));

// درخواست اطلاعات از API Points
async function fetchUserPoints(fid: string | number, season: string = "current") {
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
  } catch (error) {
    console.error("Error fetching user points:", error);
    return null;
  }
}

// درخواست اطلاعات از API Allowances
async function fetchUserAllowances(fid: string | number) {
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
    const sortedData = data.sort(
      (a: { snapshot_day: string }, b: { snapshot_day: string }) =>
        new Date(b.snapshot_day).getTime() - new Date(a.snapshot_day).getTime()
    );

    // انتخاب روز آخر
    const lastDay = sortedData[0];
    if (lastDay) {
      console.log(
        `Last Allowances for FID ${fid}:`,
        `Date: ${lastDay.snapshot_day}, Tip Allowance: ${lastDay.tip_allowance}, Remaining Tip Allowance: ${lastDay.remaining_tip_allowance}`
      );
      console.log("Last Snapshot Date:", sortedData[0]?.snapshot_day);
    }

    return lastDay; // بازگشت روز آخر
  } catch (error) {
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

  let points: string | null = null;
  let lastTipAllowance: { date: string; tip_allowance: string; remaining_tip_allowance: string; tipped: string } | null = null;

  const page2Url = `https://degen-state-1.onrender.com?fid=${encodeURIComponent(
    fid
  )}&username=${encodeURIComponent(username)}&pfpUrl=${encodeURIComponent(pfpUrl)}`;

  // لینک اصلی کست
  const longComposeCastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(
    "Check Your Degen State\n\nFrame By @jeyloo"
  )}&embeds[]=${encodeURIComponent(page2Url)}`;

  const composeCastUrl = longComposeCastUrl; // لینک مستقیم استفاده می‌شود

  // دریافت اطلاعات Points و Allowances
  if (fid !== "FID Not Available") {
    const pointsData = await fetchUserPoints(fid);
    if (Array.isArray(pointsData) && pointsData.length > 0) {
      points = pointsData[0].points;
    } else {
      points = "No Points Available";
    }

    const lastAllowance = await fetchUserAllowances(fid);
    if (lastAllowance) {
      const tipped =
        parseFloat(lastAllowance.tip_allowance) - parseFloat(lastAllowance.remaining_tip_allowance);
      lastTipAllowance = {
        date: lastAllowance.snapshot_day,
        tip_allowance: lastAllowance.tip_allowance,
        remaining_tip_allowance: lastAllowance.remaining_tip_allowance,
        tipped: Math.round(tipped).toString(),
      };
    }
  }

  return c.res({
    image: (
      <div
        style={{
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
        }}
      >
        {/* تصویر صفحه دوم */}
        <img
          src="https://i.imgur.com/XznXt9o.png"
          alt="Frog Frame - Page 2"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
        {/* نمایش تصویر PFP */}
        {pfpUrl && (
          <img
            src={pfpUrl}
            alt="Profile Picture"
            style={{
              width: "230px",
              height: "230px",
              borderRadius: "50%",
              position: "absolute",
              top: "21%",
              left: "35%",
              transform: "translate(-50%, -50%)",
              border: "3px solid white",
            }}
          />
        )}
        {/* نمایش Username */}
        <p
          style={{
            color: "cyan",
            fontSize: "50px",
            fontWeight: "700",
            position: "absolute",
            top: "10%",
            left: "55.5%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {username}
        </p>
        {/* نمایش FID */}
        <p
          style={{
            color: "yellow",
            fontSize: "18px",
            fontWeight: "500",
            position: "absolute",
            top: "20%",
            left: "55.5%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {fid}
        </p>
        {/* نمایش Points */}
        <p
          style={{
            color: points === "N/A" ? "red" : "purple",
            fontSize: "45px",
            fontWeight: "1100",
            position: "absolute",
            top: "37%",
            left: "67%",
            transform: "translate(-50%, -50%) rotate(15deg)",
          }}
        >
          {points || "No Points Available"}
        </p>
        {/* نمایش Tip Allowance */}
        {lastTipAllowance && (
          <>
            <p
              style={{
                color: "yellow",
                fontSize: "45px",
                fontWeight: "700",
                position: "absolute",
                top: "48%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              {`${lastTipAllowance.tip_allowance}`}
            </p>
            <p
              style={{
                color: "lime",
                fontSize: "45px",
                fontWeight: "700",
                position: "absolute",
                top: "68%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              {`${lastTipAllowance.remaining_tip_allowance}`}
            </p>
            <p
              style={{
                color: "darkred",
                fontSize: "45px",
                fontWeight: "700",
                position: "absolute",
                top: "85%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              {`${lastTipAllowance.tipped}`}
            </p>
          </>
        )}
      </div>
    ),
    intents: [
      <Button value="page2">My State</Button>, // دکمه My State
      <Button.Link href={composeCastUrl}>Share</Button.Link>, // دکمه Share
    ],
  });
});

const port = process.env.PORT || 3000;
createServer(async (req, res) => {
  const request = toFetchRequest(req); // تبدیل IncomingMessage به Request
  const response = await app.fetch(request);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(await response.text());
}).listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
