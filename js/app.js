import { setupCropYearPage } from "./pages/cropYear.js";
import { setupProvincePage } from "./pages/province.js";

import { setupCityPage } from "./pages/city.js";

(() => {
    
    class PageLoader {
        constructor() {
            // مسیرها نسبت به src/index.html (Live Server روی src)
            this.pages = {
                dashboard: "../pages/dashboard/content.html",
                "F_data/crop-year": "../pages/F_data/crop-year/content.html",
                "F_data/province": "../pages/F_data/province/content.html",
                "F_data/city": "../pages/F_data/city/content.html",


                // بقیه صفحات...
            };

            this.container = document.getElementById("page-container");
            if (!this.container) {
                console.error("عنصر #page-container پیدا نشد!");
            }

            this.currentPage = null;
        }

        getPageUrl(pageName) {
            return this.pages[pageName] || null;
        }

        async loadPage(pageName, { push = true } = {}) {
            const pageUrl = this.getPageUrl(pageName);
            if (!pageUrl) {
                console.error(`صفحه "${pageName}" تعریف نشده!`);
                this.showError(`صفحه "${pageName}" تعریف نشده!`);
                return;
            }

            // اگر همون صفحه است، الکی دوباره pushState نکن
            if (this.currentPage === pageName && push) return;

            try {
                const res = await fetch(pageUrl, { cache: "no-store" });
                if (!res.ok) throw new Error(`خطا در دریافت صفحه: ${res.status}`);

                const html = await res.text();
                if (!this.container) return;

                this.container.innerHTML = html;
                this.currentPage = pageName;

                // آپدیت URL (بدون رفرش)
                if (push) {
                    history.pushState({ page: pageName }, "", `#/${pageName}`);
                    // نکته: با Live Server بهتره hash استفاده کنیم تا 404 نگیری
                }

                // رویدادهای خاص صفحه
                eventManager.onPageLoaded(pageName);
            } catch (err) {
                console.error("خطا در لود صفحه:", err);
                this.showError(err.message);
            }
        }

        showError(message) {
            if (!this.container) return;
            this.container.innerHTML = `
        <div class="p-6 bg-red-50 text-red-700 rounded-lg">
          <h3 class="text-lg font-bold mb-2">خطا در بارگیری صفحه</h3>
          <p class="mb-4">${message}</p>
          <button data-page="dashboard"
                  class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            بازگشت به داشبورد
          </button>
        </div>
      `;
        }
    }

    class EventManager {
        constructor() {
            this.bindGlobalDelegation();
            this.bindPopState();
        }
        updatePageHeader() {
            const container = document.getElementById("page-container");
            if (!container) return;

            const pageSection = container.querySelector("[data-title]");
            if (!pageSection) return;

            const title = pageSection.getAttribute("data-title");
            const breadcrumb = pageSection.getAttribute("data-breadcrumb");

            const titleEl = document.getElementById("page-title");
            const breadcrumbEl = document.getElementById("breadcrumb");

            if (titleEl) titleEl.textContent = title;
            if (breadcrumbEl && breadcrumb) {
                breadcrumbEl.innerHTML = breadcrumb
                    .split("/")
                    .map((item) => `<span>${item.trim()}</span>`)
                    .join('<span>/</span>');
            }
        }


        bindGlobalDelegation() {
            document.addEventListener("click", (e) => {
                
                // 1) آکاردئون‌ها (اولویت بالا)
                const accTitle = e.target.closest(".accr .title");
                if (accTitle) {
                    
                    e.preventDefault();
                    const item = accTitle.closest(".accr .item");
                    if (item) this.toggleAccordion(item);
                    return;
                }
                

                // 2) اکشن‌های عمومی
                const actionEl = e.target.closest("[data-action]");
                if (actionEl) {
                    const action = actionEl.getAttribute("data-action");
                    switch (action) {
                        case "toggle-menu":
                            this.toggleMenu();
                            return;
                        case "open-user":
                            this.openUser();
                            return;
                        case "close-user":
                            this.closeUser();
                            return;
                    }
                }

                // 3) ناوبری صفحات
                const pageLink = e.target.closest("[data-page]");
                if (pageLink) {
                    e.preventDefault();
                    const pageName = pageLink.getAttribute("data-page");
                    app.loadPage(pageName);

                    // اگر موبایل بود بعد از کلیک منو بسته شود
                    if (window.innerWidth < 768) {
                        this.toggleMenu();
                    }
                    return;
                }
            });
        }


        bindPopState() {
            // چون از hash route استفاده کردیم، popstate کمتر لازم میشه،
            // ولی برای حالت‌هایی که کاربر back/forward می‌زند، hash را می‌خوانیم.
            window.addEventListener("popstate", () => {
                const page = getPageFromUrl() || "dashboard";
                app.loadPage(page, { push: false });
            });

            window.addEventListener("hashchange", () => {
                const page = getPageFromUrl() || "dashboard";
                app.loadPage(page, { push: false });
            });
        }

        onPageLoaded(pageName) {
            this.updatePageHeader();
            // اگر داشبورد است
            if (pageName === "dashboard") {
                this.loadDashboardCharts();
            }
            if (pageName === "F_data/crop-year") {
                setupCropYearPage();
            }
            if (pageName === "F_data/province") {
                setupProvincePage();
            }
            if (pageName === "F_data/city") {
                setupCityPage();
            }


        }

        toggleAccordion(item) {
            const openItem = document.querySelector(".accr .item.active");
            if (openItem && openItem !== item) {
                openItem.classList.remove("active");
                openItem.querySelector(".icon")?.classList.remove("rotate-180");
                const openContent = openItem.querySelector(".content");
                if (openContent) openContent.style.maxHeight = "0px";
            }

            const content = item.querySelector(".content");
            const icon = item.querySelector(".icon");
            if (!content) return;

            const isOpen = item.classList.contains("active");

            if (isOpen) {
                item.classList.remove("active");
                content.style.maxHeight = "0px";
                icon?.classList.remove("rotate-180");
            } else {
                item.classList.add("active");
                content.style.maxHeight = content.scrollHeight + "px";
                icon?.classList.add("rotate-180");
            }
        }



        toggleMenu() {
            const menu = document.querySelector("#menu");
            const overlay = document.querySelector("#overlay");
            if (!menu || !overlay) return;

            const isClosed = menu.classList.contains("translate-x-full");

            if (isClosed) {
                // باز کن
                menu.classList.remove("translate-x-full");
                overlay.classList.remove("hidden");
            } else {
                // ببند
                menu.classList.add("translate-x-full");
                overlay.classList.add("hidden");
            }
        }


        openUser() {
            const user = document.querySelector("#user");
            if (!user) return;
            user.classList.add("h-full");
            user.classList.remove("h-0");
        }

        closeUser() {
            const user = document.querySelector("#user");
            if (!user) return;
            user.classList.remove("h-full");
            user.classList.add("h-0");
        }

        loadDashboardCharts() {
            console.log("لود چارت‌های داشبورد");
        }
    }

    function getPageFromUrl() {
        // مسیر را از hash می‌خوانیم: #/dashboard یا #/data/crop-year
        const hash = window.location.hash || "";
        const match = hash.match(/^#\/(.+)$/);
        return match ? match[1] : null;
    }

    // global instances
    const app = new PageLoader();
    const eventManager = new EventManager();

    // optional: expose for debugging
    window.app = app;
    window.eventManager = eventManager;

    document.addEventListener("DOMContentLoaded", () => {
        
        const initialPage = getPageFromUrl() || "dashboard";
        app.loadPage(initialPage, { push: true });
        
        window.togglemenu = () => eventManager.toggleMenu();
        
    });
})();
