import puppeteer, { Browser } from "puppeteer";
import { Review } from "../types";

export async function crawlReviews(url: string): Promise<Review[]> {
  let browser: Browser | null = null;
  console.log(`Crawling reviews for URL: ${url}`);
  try {
    console.log("Launching browser...");
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1920,1080"],
    });
    console.log("Browser launched.");

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    console.log("Navigating to page...");
    await page.goto(url, { waitUntil: "networkidle0", timeout: 120000 });
    console.log("Page loaded.");

    // 페이지가 완전히 로드될 때까지 추가 대기
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 리뷰 요소들 찾기 (여러 셀렉터 시도)
    console.log("Looking for review elements...");
    const selectors = [
      "div.jJc9Ad", // 기존 셀렉터
      "div[data-review-id]", // 리뷰 ID 속성
      "div[jscontroller] div.MyEned", // 리뷰 컨테이너
      "div.m6QErb[aria-label]", // 리뷰 섹션
    ];

    let reviewElements = null;
    for (const selector of selectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          console.log(`Found reviews using selector: ${selector}`);
          reviewElements = elements;
          break;
        }
      } catch (error) {
        console.log(`Selector ${selector} failed, trying next...`);
        continue;
      }
    }

    if (!reviewElements) {
      throw new Error("Could not find any review elements with known selectors.");
    }

    // 리뷰 데이터 추출
    console.log("Extracting review data...");
    const reviews = await page.evaluate(() => {
      // 여러 가능한 셀렉터 조합 시도
      const findElement = (parent: Element, selectors: string[]): Element | null => {
        for (const selector of selectors) {
          const element = parent.querySelector(selector);
          if (element) return element;
        }
        return null;
      };

      // 리뷰 요소들 찾기
      const reviewElements = Array.from(
        document.querySelectorAll("div.jJc9Ad, div[data-review-id], div.MyEned")
      );

      return reviewElements
        .map((element) => {
          // 텍스트 내용 찾기
          const textSelectors = ["span.wiI7pd", "div.MyEned", "div[jsan]"];
          const textElement = findElement(element, textSelectors);

          // 평점 찾기
          const ratingSelectors = [
            'span.kvMYJc[role="img"]',
            'span[aria-label*="stars"]',
            'div[aria-label*="stars"]',
          ];
          const ratingElement = findElement(element, ratingSelectors);

          // 날짜 찾기
          const dateSelectors = ["span.rsqaWe", 'span[class*="date"]'];
          const dateElement = findElement(element, dateSelectors);

          const text = textElement?.textContent || "";
          const ratingText = ratingElement?.getAttribute("aria-label") || "";
          // Ensure ratingText is a string before calling match
          const ratingMatch = typeof ratingText === "string" ? ratingText.match(/\d+/) : null;
          const rating = ratingMatch ? parseInt(ratingMatch[0], 10) : 0;
          const date = dateElement?.textContent || "";

          return {
            text: text.trim(),
            rating,
            date: date.trim(),
          };
        })
        .filter((review) => review.text && review.rating > 0); // 유효한 리뷰만 필터링
    });

    console.log(`Extracted ${reviews.length} valid reviews.`);
    return reviews;
  } catch (error) {
    console.error("Error during crawling:", error);
    if (error instanceof Error) {
      if (error.message.includes("Timeout")) {
        throw new Error("Page navigation or element loading timed out.");
      }
      if (error.message.includes("selector")) {
        throw new Error(
          "Could not find the review elements. Google Maps structure might have changed."
        );
      }
    }
    throw new Error(
      `Failed to crawl reviews: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    if (browser) {
      console.log("Closing browser...");
      await browser.close();
      console.log("Browser closed.");
    }
  }
}
