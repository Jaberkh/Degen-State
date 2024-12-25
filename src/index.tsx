import { serve } from "@hono/node-server";

import { serveStatic } from "@hono/node-server/serve-static";
import { Button, Frog } from "frog";
import { neynar } from "frog/middlewares";

// تعریف متغیرهای Neynar
interface NeynarVariables {
  interactor?: {
    fid: string;
    username: string;
    pfpUrl: string;
  };
  cast?: any;
  [key: string]: any; // برای سازگاری با Schema
}

// تعریف یک تایپ عمومی برای Env
type Env = {
  [key: string]: unknown;
};

// تعریف اپلیکیشن Frog
export const app = new Frog<Env, NeynarVariables>({
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
  .use(
    neynar({
      apiKey: "NEYNAR_FROG_FM", // کلید API برای Neynar
      features: ["interactor", "cast"], // فعال کردن ویژگی‌های موردنیاز
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
    }

    return lastDay; // بازگشت روز آخر
  } catch (error) {
    console.error("Error fetching user allowances:", error);
    return null;
  }
}

// تعریف تابع کوتاه‌کننده لینک
async function shortenUrl(longUrl: string): Promise<string | null> {
  const bitlyAccessToken = "YOUR_BITLY_ACCESS_TOKEN"; // جایگزین با Access Token
  const apiUrl = "https://api-ssl.bitly.com/v4/shorten";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bitlyAccessToken}`,
      },
      body: JSON.stringify({
        long_url: longUrl,
      }),
    });

    if (!response.ok) {
      console.error(`Bitly API Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.link; // لینک کوتاه‌شده
  } catch (error) {
    console.error("Error shortening URL:", error);
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

  const page2Url = `https://degenstate.onrender.com?fid=${encodeURIComponent(
    fid
  )}&username=${encodeURIComponent(username)}&pfpUrl=${encodeURIComponent(pfpUrl)}`;
  
  // لینک اصلی کست
  const longComposeCastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(
    "Check Your Degen State\n\nFrame By @jeyloo"
  )}&embeds[]=${encodeURIComponent(page2Url)}`;
  
  // لینک کوتاه‌شده
  const composeCastUrl = await shortenUrl(longComposeCastUrl) || longComposeCastUrl;

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


const port = parseInt(process.env.PORT || "3000", 10);
serve(app).listen(port, () => {
  console.log(`Server is running on port ${port}`);
});