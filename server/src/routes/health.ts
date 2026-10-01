import { Router } from "express";

// 健康检查接口
const router = Router();

router.get("/health", async (req, res) => {
   res.json({
      success: true,
    });
});

export default router;
