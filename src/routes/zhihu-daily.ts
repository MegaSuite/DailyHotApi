import type { RouterData } from "../types.js";
import type { RouterType } from "../router.types.js";
import { get } from "../utils/getData.js";

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "zhihu-daily",
    title: "知乎日报",
    type: "推荐榜",
    description: "每天三次，每次七分钟",
    link: "https://daily.zhihu.com/",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  try {
    // Get the latest data
    const url = `https://daily.zhihu.com/api/4/news/latest`;
    const result = await get({
      url,
      noCache,
      headers: {
        Referer: "https://daily.zhihu.com/api/4/news/latest",
        Host: "daily.zhihu.com",
      },
    });

    const list = result.data.stories.filter((el: RouterType["zhihu-daily"]) => el.type === 0);

    // Get the previous day's data
    let date = result.data.date;
    const year = parseInt(date.substring(0, 4), 10);
    const month = parseInt(date.substring(4, 6), 10) - 1;
    const day = parseInt(date.substring(6, 8), 10);

    const previousDate = new Date(year, month, day);
    previousDate.setDate(previousDate.getDate() - 1);
    const previousDateString = previousDate.toISOString().split("T")[0].replace(/-/g, "");

    const beforeURL = `https://daily.zhihu.com/api/4/news/before/${previousDateString}`;
    const beforeResult = await get({
      url: beforeURL,
      noCache,
      headers: {
        Referer: beforeURL,
        Host: "daily.zhihu.com",
      },
    });

    const beforeList = beforeResult.data.stories.filter((el: RouterType["zhihu-daily"]) => el.type === 0);
    // Combine the two lists
    const combinedList = list.concat(beforeList);

    return {
      fromCache: result.fromCache,
      updateTime: result.updateTime,
      data: combinedList.map((v: RouterType["zhihu-daily"]) => ({
        id: v.id,
        title: v.title,
        cover: v.images?.[0] ?? undefined,
        author: v.hint,
        hot: undefined,
        timestamp: undefined,
        url: v.url,
        mobileUrl: v.url,
      })),
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};