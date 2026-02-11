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
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9,ko;q=0.8",
    });
    console.log("Navigating to page...");
    await page.goto(url, { waitUntil: "networkidle0", timeout: 120000 });
    console.log("Page loaded.");

    // 페이지가 완전히 로드될 때까지 추가 대기
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 쿠키/동의 배너 처리
    try {
      const consentSelectors = [
        'button[aria-label*="I agree"]',
        'button[aria-label*="Accept all"]',
        'button[aria-label*="동의"]',
        'button[aria-label*="수락"]',
      ];
      for (const selector of consentSelectors) {
        const btn = await page.$(selector);
        if (btn) {
          await btn.click();
          await new Promise((resolve) => setTimeout(resolve, 1500));
          break;
        }
      }
      await page.evaluate(() => {
        const labels = ["I agree", "Accept all", "동의", "수락"];
        const buttons = Array.from(document.querySelectorAll("button, div[role='button']"));
        const target = buttons.find((btn) =>
          labels.some((label) => (btn.textContent || "").includes(label))
        );
        if (target) (target as HTMLElement).click();
      });
    } catch (error) {
      console.log("Consent banner click skipped:", error);
    }

    // 자동화 차단/캡차 감지 (빠르게 원인 표시)
    try {
      const pageText = await page.evaluate(() => (document.body?.innerText || "").slice(0, 5000));
      if (
        pageText.includes("unusual traffic") ||
        pageText.includes("automated queries") ||
        pageText.includes("Sorry") ||
        pageText.includes("Before you continue")
      ) {
        throw new Error("Google Maps blocked automated access.");
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("blocked automated access")) {
        throw error;
      }
      console.log("Captcha detection skipped:", error);
    }

    // 리뷰 탭/버튼 클릭 시도
    try {
      const reviewButtonSelectors = [
        'button[jsaction="pane.reviewChart.moreReviews"]',
        'button[jsaction*="reviewChart"]',
        'button[jsaction*="pane.review"]',
        'button[aria-label*="reviews"]',
        'button[aria-label*="리뷰"]',
        'button[aria-label*="Review"]',
        'a[href*="reviews"]',
      ];
      for (const selector of reviewButtonSelectors) {
        const btn = await page.$(selector);
        if (btn) {
          await btn.click();
          await new Promise((resolve) => setTimeout(resolve, 2000));
          break;
        }
      }
      await page.evaluate(() => {
        const keywords = ["reviews", "리뷰", "Review"];
        const candidates = Array.from(document.querySelectorAll("button, a, div[role='button']"));
        const target = candidates.find((el) =>
          keywords.some((keyword) => (el.textContent || "").toLowerCase().includes(keyword))
        );
        if (target) (target as HTMLElement).click();
      });
    } catch (error) {
      console.log("Review tab click skipped:", error);
    }

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

    // 리뷰 스크롤 영역을 찾아서 스크롤
    console.log("Scrolling review container...");
    const reviewContainerSelectors = [
      "div.m6QErb[aria-label]",
      "div.m6QErb.DxyBCb",
      "div.m6QErb[tabindex='0']",
      "div[role='feed']",
    ];
    for (const selector of reviewContainerSelectors) {
      const container = await page.$(selector);
      if (container) {
        for (let i = 0; i < 6; i++) {
          await container.evaluate((el) => {
            el.scrollBy(0, 600);
          });
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }
        break;
      }
    }

    // "More" 버튼 클릭 (리뷰 본문 확장)
    try {
      const moreButtonSelectors = [
        'button[jsname="gxjVle"]',
        'button[aria-label*="More"]',
        'button[aria-label*="더보기"]',
      ];
      for (const selector of moreButtonSelectors) {
        const buttons = await page.$$(selector);
        if (buttons.length > 0) {
          for (const btn of buttons) {
            await btn.click();
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
          break;
        }
      }
    } catch (error) {
      console.log("Review expand click skipped:", error);
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
        document.querySelectorAll(
          "div.jJc9Ad, div[data-review-id], div.MyEned, div.m6QErb[aria-label] div[data-review-id], div[jscontroller='e6Mltc']"
        )
      );

      const parsed = reviewElements.map((element) => {
        // 텍스트 내용 찾기
        const textSelectors = [
          "span.wiI7pd",
          'span[jsname="fbQN7e"]',
          "div.MyEned",
          "div[jsan]",
          "span[lang]",
          "span.review-full-text",
          "div[data-review-id] span",
        ];
        const textElement = findElement(element, textSelectors);

        // 평점 찾기
        const ratingSelectors = [
          'span.kvMYJc[role="img"]',
          'span[aria-label*="stars"]',
          'div[aria-label*="stars"]',
          'span[aria-label*="별점"]',
          'span[role="img"][aria-label]',
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
      });

      const valid = parsed.filter((review) => review.text && review.text.length > 3);
      return valid.length > 0 ? valid : parsed;
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
