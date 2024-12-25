import { serveStatic } from "@hono/node-server/serve-static";
import { Button, Frog } from "frog";
import { neynar } from "frog/middlewares";
import { serve } from "@hono/node-server";
import dotenv from "dotenv";

// بارگذاری متغیرهای محیطی از فایل .env
dotenv.config();

// بررسی کلید API
const AIRSTACK_API_KEY = process.env.AIRSTACK_API_KEY;
if (!AIRSTACK_API_KEY) {
  console.error("AIRSTACK_API_KEY is not defined in the environment variables");
  throw new Error("AIRSTACK_API_KEY is missing");
}
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
if (!NEYNAR_API_KEY) {
  console.error("NEYNAR_API_KEY is not defined in the environment variables");
  throw new Error("NEYNAR_API_KEY is missing");
}
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
  hub: {
    apiUrl: "https://hubs.airstack.xyz",
    fetchOptions: {
      headers: {
        "x-airstack-hubs": AIRSTACK_API_KEY, // استفاده از کلید API
      },
    },
  },
});

// گسترش ContextVariableMap برای شناسایی interactor
declare module "frog" {
  interface ContextVariableMap {
    interactor?: {
      fid: string;
      username: string;
      pfpUrl: string;
    };
    cast?: any;
  }
}


// افزودن میدلور neynar به اپلیکیشن Frog
app.use(
  neynar({
    apiKey: NEYNAR_API_KEY, // کلید API برای Neynar
    features: ["interactor", "cast"], // فعال کردن ویژگی‌های موردنیاز
  })
);



  
  app.use("/*", serveStatic({ root: "./public" }));

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
  const interactor = (c.var as any).interactor;
const fid = interactor?.fid || "FID Not Available";
const username = interactor?.username || "Username Not Available";
const pfpUrl = interactor?.pfpUrl || "";



  let points: string | null = null;
  let lastTipAllowance: { date: string; tip_allowance: string; remaining_tip_allowance: string; tipped: string } | null = null;

  const page2Url = `https://degen-state-1.onrender.com?fid=${encodeURIComponent(
    fid
  )}&username=${encodeURIComponent(username)}&pfpUrl=${encodeURIComponent(pfpUrl)}`;
  
  // لینک اصلی کست
  const longComposeCastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(
    "Check Your Degen State\n\nFrame By @jeyloo"
  )}&embeds[]=${encodeURIComponent(page2Url)}`;

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
      const tipAllowance = parseFloat(lastAllowance.tip_allowance) || 0;
      const remainingTipAllowance = parseFloat(lastAllowance.remaining_tip_allowance) || 0;
      const tipped = tipAllowance - remainingTipAllowance;
    
      lastTipAllowance = {
        date: lastAllowance.snapshot_day || "N/A",
        tip_allowance: tipAllowance.toString(),
        remaining_tip_allowance: remainingTipAllowance.toString(),
        tipped: Math.round(tipped).toString(),
      };
    } else {
      lastTipAllowance = {
        date: "N/A",
        tip_allowance: "0",
        remaining_tip_allowance: "0",
        tipped: "0",
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
          alt="Degen State - Page 2"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            zIndex: 1, // تصویر را در بالاترین لایه قرار می‌دهد
            position: "relative",
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
            fontSize: username.length > 5 ? "45px" : "50px", 
            fontWeight: "700",
            position: "absolute",
            top: "10%",
            left: "55%",
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
            color: points === "N/A" || points === "0"? "red" : "purple",
            fontSize: "45px",
            fontWeight: "1100",
            position: "absolute",
            top: "37%",
            left: "67%",
            transform: "translate(-50%, -50%) rotate(15deg)",
          }}
        >
          {points || "0"}
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
      <Button.Link href={longComposeCastUrl}>Share</Button.Link>, // دکمه Share
    ],
  });
});

const port = process.env.PORT || 3000;

// اطمینان از استفاده صحیح از عدد به عنوان پورت
serve(app);

console.log(`Server is running on port ${port}`);
