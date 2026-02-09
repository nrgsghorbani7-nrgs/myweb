// src/js/pages/province.js
export function setupProvincePage() {
    const container = document.getElementById("page-container");
    if (!container) return;

    const page = container.querySelector("#province-page");
    if (!page) return;

    const selectEl = page.querySelector("#provinceSelect");
    const addBtn = page.querySelector("#addProvinceBtn");
    const tbody = page.querySelector("#provinceTbody");
    const countEl = page.querySelector("#provinceCount");

    if (!selectEl || !addBtn || !tbody || !countEl) return;

    const STORAGE_KEY = "provinces";

    const todayFa = () =>
        new Date().toLocaleDateString("fa-IR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });

    const read = () => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        } catch {
            return [];
        }
    };

    const write = (items) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

    const render = () => {
        const items = read();

        tbody.innerHTML = items
            .map(
                (r) => `
        <tr>
          <td class="px-4 py-3 vazirmatn-600 text-[#2B1B1B] whitespace-nowrap">${r.name}</td>
          <td class="px-4 py-3 text-black/70 whitespace-nowrap">${r.createdAt}</td>
          <td class="px-4 py-3">
            <button class="p-2 rounded-lg hover:bg-black/5 transition"
                    title="حذف"
                    data-province-action="delete"
                    data-id="${r.id}">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-[#7A4A4A]" viewBox="0 0 24 24" fill="none">
                <path d="M9 3h6m-8 4h10m-9 0 1 14h6l1-14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 11v6m4-6v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </td>
        </tr>
      `
            )
            .join("");

        countEl.textContent = `تعداد: ${items.length}`;
    };

    const addProvince = () => {
        const name = selectEl.value;
        const items = read();

        if (items.some((x) => x.name === name)) {
            alert("این استان قبلاً ثبت شده است.");
            return;
        }

        items.unshift({
            id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
            name,
            createdAt: todayFa(),
        });

        write(items);
        render();
    };

    const deleteProvince = (id) => {
        write(read().filter((x) => x.id !== id));
        render();
    };

    if (!page.dataset.bound) {
        addBtn.addEventListener("click", addProvince);

        page.addEventListener("click", (e) => {
            const btn = e.target.closest('[data-province-action="delete"]');
            if (!btn) return;

            const id = btn.getAttribute("data-id");
            if (!id) return;

            if (confirm("این رکورد حذف شود؟")) deleteProvince(id);
        });

        page.dataset.bound = "1";
    }

    render();
}
