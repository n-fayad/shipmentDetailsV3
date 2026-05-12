const shipments = window.SHIPMENTS;

const statusLabels = {
  pending_pickup: "Pending Pickup",
  pickup_attempts_exhausted: "Pickup Attempts Exhausted",
  out_for_delivery: "Out for Delivery",
  unable_to_deliver: "Unable to Deliver",
  delivered: "Delivered"
};

const state = {
  tab: "all_shipments"
};

const appliedAdvancedFilters = {
  creationDateFrom: "",
  creationDateTo: "",
  pickupAttempts: "all",
  deliveryAttempts: "all",
  holdTime: "all"
};

const holdTimeLabels = {
  all: "All",
  with_value: "Has Hold Time",
  none: "No Hold Time (-)"
};

const elements = {
  allShipmentsTab: document.getElementById("allShipmentsTab"),
  needsAttentionTab: document.getElementById("needsAttentionTab"),
  searchInput: document.getElementById("searchInput"),
  channelFilter: document.getElementById("channelFilter"),
  statusFilter: document.getElementById("statusFilter"),
  creationDateFrom: document.getElementById("creationDateFrom"),
  creationDateTo: document.getElementById("creationDateTo"),
  sortBy: document.getElementById("sortBy"),
  pickupAttemptsFilter: document.getElementById("pickupAttemptsFilter"),
  deliveryAttemptsFilter: document.getElementById("deliveryAttemptsFilter"),
  holdTimeFilter: document.getElementById("holdTimeFilter"),
  resetFiltersBtn: document.getElementById("resetFiltersBtn"),
  activeFilters: document.getElementById("activeFilters"),
  exportBtn: document.getElementById("exportBtn"),
  shipmentsBody: document.getElementById("shipmentsBody"),
  holdTimeHeader: document.getElementById("holdTimeHeader"),
  openAdvancedFiltersBtn: document.getElementById("openAdvancedFiltersBtn"),
  closeAdvancedFiltersBtn: document.getElementById("closeAdvancedFiltersBtn"),
  applyAdvancedFiltersBtn: document.getElementById("applyAdvancedFiltersBtn"),
  clearAdvancedFiltersBtn: document.getElementById("clearAdvancedFiltersBtn"),
  advancedFiltersOverlay: document.getElementById("advancedFiltersOverlay"),
  advancedFilterCount: document.getElementById("advancedFilterCount")
};

function isNeedsAttention(shipment) {
  return (
    shipment.status === "pickup_attempts_exhausted" ||
    shipment.status === "unable_to_deliver"
  );
}

function getFilteredData() {
  const searchTerm = elements.searchInput.value.trim().toLowerCase();
  const channel = elements.channelFilter.value;
  const status = elements.statusFilter.value;
  const from = appliedAdvancedFilters.creationDateFrom;
  const to = appliedAdvancedFilters.creationDateTo;
  const pickupAttemptsFilter = appliedAdvancedFilters.pickupAttempts;
  const deliveryAttemptsFilter = appliedAdvancedFilters.deliveryAttempts;
  const holdTimeFilter = appliedAdvancedFilters.holdTime;
  const sortBy = elements.sortBy.value;

  let result = shipments.filter((shipment) => {
    if (state.tab === "needs_attention" && !isNeedsAttention(shipment)) {
      return false;
    }

    if (searchTerm) {
      const searchable = [
        shipment.awb,
        shipment.order,
        shipment.manifest,
        shipment.customerPhone
      ]
        .join(" ")
        .toLowerCase();
      if (!searchable.includes(searchTerm)) {
        return false;
      }
    }

    if (channel !== "all" && shipment.channel !== channel) {
      return false;
    }

    if (status !== "all" && shipment.status !== status) {
      return false;
    }

    if (from && shipment.createdAt < from) {
      return false;
    }

    if (to && shipment.createdAt > to) {
      return false;
    }

    if (
      pickupAttemptsFilter !== "all" &&
      shipment.pickupAttempts !== Number(pickupAttemptsFilter)
    ) {
      return false;
    }

    if (
      deliveryAttemptsFilter !== "all" &&
      shipment.deliveryAttempts !== Number(deliveryAttemptsFilter)
    ) {
      return false;
    }

    if (state.tab === "needs_attention") {
      if (holdTimeFilter === "with_value" && shipment.holdTimeHours === null) {
        return false;
      }
      if (holdTimeFilter === "none" && shipment.holdTimeHours !== null) {
        return false;
      }
    }

    return true;
  });

  if (sortBy === "created_desc" || sortBy === "created_asc") {
    result.sort((a, b) => {
      if (sortBy === "created_asc") {
        return a.createdAt.localeCompare(b.createdAt);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }

  if (
    state.tab === "needs_attention" &&
    (sortBy === "hold_desc" || sortBy === "hold_asc")
  ) {
    result.sort((a, b) => {
      const aVal = a.holdTimeHours === null ? -1 : a.holdTimeHours;
      const bVal = b.holdTimeHours === null ? -1 : b.holdTimeHours;
      return sortBy === "hold_asc" ? aVal - bVal : bVal - aVal;
    });
  }

  return result;
}

function renderTable() {
  const filtered = getFilteredData();
  elements.holdTimeHeader.classList.toggle(
    "hidden",
    state.tab !== "needs_attention"
  );
  renderActiveFilterChips();
  updateResetButtonVisibility();
  updateAdvancedFilterCount();

  if (!filtered.length) {
    const colSpan = state.tab === "needs_attention" ? 9 : 8;
    elements.shipmentsBody.innerHTML = `<tr><td colspan="${colSpan}" class="empty">No shipments match the selected filters.</td></tr>`;
    return;
  }

  elements.shipmentsBody.innerHTML = filtered
    .map((shipment) => {
      const holdTimeCell =
        state.tab === "needs_attention"
          ? `<td>${shipment.status === "unable_to_deliver" && shipment.holdTimeHours !== null ? `${shipment.holdTimeHours}h` : "-"}</td>`
          : "";
      const rowClass = state.tab === "needs_attention" ? "needs-row" : "";

      return `<tr class="${rowClass}">
        <td><a href="./shipment.html?awb=${encodeURIComponent(
          shipment.awb
        )}&status=${encodeURIComponent(shipment.status)}">${shipment.awb}</a><br /><small>${shipment.channel.toUpperCase()}</small></td>
        <td>${shipment.order}</td>
        <td>${shipment.customerPhone}</td>
        <td>${shipment.quantity} item${shipment.quantity > 1 ? "s" : ""}</td>
        <td><span class="status-pill status-${shipment.status}">${statusLabels[shipment.status]}</span></td>
        <td>${shipment.pickupAttempts}</td>
        <td>${shipment.deliveryAttempts}</td>
        <td>${formatDate(shipment.createdAt)}</td>
        ${holdTimeCell}
      </tr>`;
    })
    .join("");
}

function getSortLabel(sortValue) {
  const sortLabels = {
    created_desc: "Creation Date: Newest First",
    created_asc: "Creation Date: Oldest First",
    hold_desc: "Hold Time: Longest First",
    hold_asc: "Hold Time: Shortest First"
  };
  return sortLabels[sortValue] || sortValue;
}

function getActiveFilters() {
  const activeFilters = [];
  const searchTerm = elements.searchInput.value.trim();
  if (searchTerm) {
    activeFilters.push({ key: "search", label: `Search: ${searchTerm}` });
  }
  if (elements.channelFilter.value !== "all") {
    activeFilters.push({
      key: "channel",
      label: `Channel: ${elements.channelFilter.options[elements.channelFilter.selectedIndex].text}`
    });
  }
  if (elements.statusFilter.value !== "all") {
    activeFilters.push({
      key: "status",
      label: `Status: ${elements.statusFilter.options[elements.statusFilter.selectedIndex].text}`
    });
  }
  if (appliedAdvancedFilters.creationDateFrom) {
    activeFilters.push({
      key: "creationFrom",
      label: `Created From: ${appliedAdvancedFilters.creationDateFrom}`
    });
  }
  if (appliedAdvancedFilters.creationDateTo) {
    activeFilters.push({
      key: "creationTo",
      label: `Created To: ${appliedAdvancedFilters.creationDateTo}`
    });
  }
  if (appliedAdvancedFilters.pickupAttempts !== "all") {
    activeFilters.push({
      key: "pickupAttempts",
      label: `Pickup Attempts: ${appliedAdvancedFilters.pickupAttempts}`
    });
  }
  if (appliedAdvancedFilters.deliveryAttempts !== "all") {
    activeFilters.push({
      key: "deliveryAttempts",
      label: `Delivery Attempts: ${appliedAdvancedFilters.deliveryAttempts}`
    });
  }
  if (appliedAdvancedFilters.holdTime !== "all") {
    activeFilters.push({
      key: "holdTime",
      label: `Hold Time: ${holdTimeLabels[appliedAdvancedFilters.holdTime]}`
    });
  }
  if (elements.sortBy.value !== "none") {
    activeFilters.push({
      key: "sortBy",
      label: `Sort: ${getSortLabel(elements.sortBy.value)}`
    });
  }
  return activeFilters;
}

function renderActiveFilterChips() {
  const activeFilters = getActiveFilters();
  const hasFilters = activeFilters.length > 0;
  elements.activeFilters.classList.toggle("hidden", !hasFilters);
  const chipsHtml = activeFilters
    .map(
      (filter) =>
        `<span class="filter-chip">${filter.label}<button type="button" data-filter-key="${filter.key}" aria-label="Remove ${filter.label}">\u00d7</button></span>`
    )
    .join("");
  const resetButtonHtml = hasFilters
    ? `<button id="resetFiltersBtn" class="button reset-button">Reset Filters</button>`
    : "";
  elements.activeFilters.innerHTML = `${chipsHtml}${resetButtonHtml}`;
  elements.resetFiltersBtn = document.getElementById("resetFiltersBtn");
}

function clearFilterByKey(key) {
  if (key === "search") elements.searchInput.value = "";
  if (key === "channel") elements.channelFilter.value = "all";
  if (key === "status") elements.statusFilter.value = "all";
  if (key === "creationFrom") {
    appliedAdvancedFilters.creationDateFrom = "";
    elements.creationDateFrom.value = "";
  }
  if (key === "creationTo") {
    appliedAdvancedFilters.creationDateTo = "";
    elements.creationDateTo.value = "";
  }
  if (key === "pickupAttempts") {
    appliedAdvancedFilters.pickupAttempts = "all";
    elements.pickupAttemptsFilter.value = "all";
  }
  if (key === "deliveryAttempts") {
    appliedAdvancedFilters.deliveryAttempts = "all";
    elements.deliveryAttemptsFilter.value = "all";
  }
  if (key === "holdTime") {
    appliedAdvancedFilters.holdTime = "all";
    elements.holdTimeFilter.value = "all";
  }
  if (key === "sortBy") elements.sortBy.value = "none";
}

function hasActiveFilters() {
  return (
    elements.searchInput.value.trim() !== "" ||
    elements.channelFilter.value !== "all" ||
    elements.statusFilter.value !== "all" ||
    elements.sortBy.value !== "none" ||
    appliedAdvancedFilters.creationDateFrom !== "" ||
    appliedAdvancedFilters.creationDateTo !== "" ||
    appliedAdvancedFilters.pickupAttempts !== "all" ||
    appliedAdvancedFilters.deliveryAttempts !== "all" ||
    appliedAdvancedFilters.holdTime !== "all"
  );
}

function updateResetButtonVisibility() {
  if (!elements.resetFiltersBtn) return;
  elements.resetFiltersBtn.classList.toggle("hidden", !hasActiveFilters());
}

function countActiveAdvancedFilters() {
  let count = 0;
  if (appliedAdvancedFilters.creationDateFrom) count += 1;
  if (appliedAdvancedFilters.creationDateTo) count += 1;
  if (appliedAdvancedFilters.pickupAttempts !== "all") count += 1;
  if (appliedAdvancedFilters.deliveryAttempts !== "all") count += 1;
  if (appliedAdvancedFilters.holdTime !== "all") count += 1;
  return count;
}

function updateAdvancedFilterCount() {
  const count = countActiveAdvancedFilters();
  elements.advancedFilterCount.textContent = count;
  elements.advancedFilterCount.classList.toggle("hidden", count === 0);
}

function setAdvancedFiltersOpen(open) {
  const overlay = elements.advancedFiltersOverlay;
  if (open) {
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("open"));
    document.body.style.overflow = "hidden";
  } else {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(() => {
      if (!overlay.classList.contains("open")) {
        overlay.hidden = true;
      }
    }, 250);
  }
}

function clearAdvancedFiltersInputs() {
  elements.creationDateFrom.value = "";
  elements.creationDateTo.value = "";
  elements.pickupAttemptsFilter.value = "all";
  elements.deliveryAttemptsFilter.value = "all";
  elements.holdTimeFilter.value = "all";
}

function syncAdvancedFiltersInputsFromApplied() {
  elements.creationDateFrom.value = appliedAdvancedFilters.creationDateFrom;
  elements.creationDateTo.value = appliedAdvancedFilters.creationDateTo;
  elements.pickupAttemptsFilter.value = appliedAdvancedFilters.pickupAttempts;
  elements.deliveryAttemptsFilter.value = appliedAdvancedFilters.deliveryAttempts;
  elements.holdTimeFilter.value = appliedAdvancedFilters.holdTime;
}

function commitAdvancedFiltersFromInputs() {
  appliedAdvancedFilters.creationDateFrom = elements.creationDateFrom.value;
  appliedAdvancedFilters.creationDateTo = elements.creationDateTo.value;
  appliedAdvancedFilters.pickupAttempts = elements.pickupAttemptsFilter.value;
  appliedAdvancedFilters.deliveryAttempts = elements.deliveryAttemptsFilter.value;
  appliedAdvancedFilters.holdTime = elements.holdTimeFilter.value;
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function resetFilters() {
  elements.searchInput.value = "";
  elements.channelFilter.value = "all";
  elements.statusFilter.value = "all";
  elements.sortBy.value = "none";
  appliedAdvancedFilters.creationDateFrom = "";
  appliedAdvancedFilters.creationDateTo = "";
  appliedAdvancedFilters.pickupAttempts = "all";
  appliedAdvancedFilters.deliveryAttempts = "all";
  appliedAdvancedFilters.holdTime = "all";
  elements.creationDateFrom.value = "";
  elements.creationDateTo.value = "";
  elements.pickupAttemptsFilter.value = "all";
  elements.deliveryAttemptsFilter.value = "all";
  elements.holdTimeFilter.value = "all";
}

function exportVisibleRows() {
  const data = getFilteredData();
  const headers = [
    "AWB Number",
    "Order Number",
    "Customer Phone Number",
    "Channel",
    "Quantity",
    "Shipment Status",
    "Pickup Attempts",
    "Delivery Attempts",
    "Created At"
  ];

  if (state.tab === "needs_attention") {
    headers.push("Hold Time");
  }

  const lines = data.map((shipment) => {
    const row = [
      shipment.awb,
      shipment.order,
      shipment.customerPhone,
      shipment.channel,
      shipment.quantity,
      statusLabels[shipment.status],
      shipment.pickupAttempts,
      shipment.deliveryAttempts,
      shipment.createdAt
    ];

    if (state.tab === "needs_attention") {
      row.push(
        shipment.status === "unable_to_deliver" && shipment.holdTimeHours !== null
          ? `${shipment.holdTimeHours}h`
          : "-"
      );
    }

    return row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",");
  });

  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${state.tab}_shipments_export.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function setTab(tabId) {
  state.tab = tabId;
  elements.allShipmentsTab.classList.toggle("active", tabId === "all_shipments");
  elements.needsAttentionTab.classList.toggle(
    "active",
    tabId === "needs_attention"
  );
  renderTable();
}

elements.allShipmentsTab.addEventListener("click", () => setTab("all_shipments"));
elements.needsAttentionTab.addEventListener("click", () =>
  setTab("needs_attention")
);

[
  elements.searchInput,
  elements.channelFilter,
  elements.statusFilter,
  elements.sortBy
].forEach((element) => element.addEventListener("input", renderTable));

elements.activeFilters.addEventListener("click", (event) => {
  const resetButton = event.target.closest("#resetFiltersBtn");
  if (resetButton) {
    resetFilters();
    renderTable();
    return;
  }
  const button = event.target.closest("[data-filter-key]");
  if (!button) return;
  clearFilterByKey(button.dataset.filterKey);
  renderTable();
});

elements.exportBtn.addEventListener("click", exportVisibleRows);

elements.openAdvancedFiltersBtn.addEventListener("click", () => {
  syncAdvancedFiltersInputsFromApplied();
  setAdvancedFiltersOpen(true);
});
elements.closeAdvancedFiltersBtn.addEventListener("click", () =>
  setAdvancedFiltersOpen(false)
);
elements.applyAdvancedFiltersBtn.addEventListener("click", () => {
  commitAdvancedFiltersFromInputs();
  renderTable();
  setAdvancedFiltersOpen(false);
});
elements.clearAdvancedFiltersBtn.addEventListener("click", () => {
  clearAdvancedFiltersInputs();
});
elements.advancedFiltersOverlay.addEventListener("click", (event) => {
  if (event.target === elements.advancedFiltersOverlay) {
    setAdvancedFiltersOpen(false);
  }
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    elements.advancedFiltersOverlay.classList.contains("open")
  ) {
    setAdvancedFiltersOpen(false);
  }
});

renderTable();
