import { serve } from "@hono/node-server";
import { app } from "./src/index"; // مسیر باقی می‌ماند زیرا TypeScript در زمان اجرا آن را تطبیق می‌دهد
// تنظیم پورت از متغیر محیطی PORT یا مقدار پیش‌فرض 3000
const port = parseInt(process.env.PORT || "3000", 10);
// اجرای سرور و گوش دادن به پورت
serve(app).listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
