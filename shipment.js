const statusLabels = {
  pending_pickup: "Pending Pickup",
  pickup_attempts_exhausted: "Pickup Attempts Exhausted",
  out_for_delivery: "Out for Delivery",
  unable_to_deliver: "Unable to Deliver",
  delivered: "Delivered"
};

const sampleTimestamps = {
  created: "05.05.2026 17:13 EEST",
  picked_up: "06.05.2026 09:42 EEST",
  out_for_delivery: "07.05.2026 11:20 EEST",
  delivered: "07.05.2026 16:08 EEST"
};

const timelineConfigByStatus = {
  pending_pickup: {
    completed: ["created"],
    active: "created"
  },
  pickup_attempts_exhausted: {
    completed: ["created"],
    active: "created"
  },
  out_for_delivery: {
    completed: ["created", "picked_up"],
    active: "out_for_delivery"
  },
  unable_to_deliver: {
    completed: ["created", "picked_up"],
    active: "out_for_delivery"
  },
  delivered: {
    completed: ["created", "picked_up", "out_for_delivery", "delivered"],
    active: "delivered"
  }
};

function buildTimeline(status) {
  const config = timelineConfigByStatus[status] || timelineConfigByStatus.pending_pickup;
  return [
    { id: "delivered", label: "Shipment Delivered" },
    { id: "out_for_delivery", label: "Out for Delivery" },
    { id: "picked_up", label: "Shipment Picked up" },
    { id: "created", label: "Shipment Created" }
  ].map((step) => {
    const completed = config.completed.includes(step.id);
    return {
      ...step,
      sub: completed ? sampleTimestamps[step.id] : "TBD",
      active: config.active === step.id,
      completed
    };
  });
}

function findShipmentByAwb(awb) {
  const all = window.SHIPMENTS || [];
  return all.find((shipment) => shipment.awb === awb) || all[0];
}

function formatChannel(channel) {
  if (!channel) return "";
  return channel.charAt(0).toUpperCase() + channel.slice(1);
}

function formatQuantity(qty) {
  const n = Number(qty) || 0;
  return `${n} Item${n === 1 ? "" : "s"}`;
}

function getShipment() {
  const params = new URLSearchParams(window.location.search);
  const awb = params.get("awb");
  const raw = findShipmentByAwb(awb);
  if (!raw) return null;
  const statusParam = params.get("status");
  const status = statusLabels[statusParam] ? statusParam : raw.status;
  return {
    ...raw,
    status,
    channelLabel: formatChannel(raw.channel),
    quantityLabel: formatQuantity(raw.quantity),
    orderNumber: raw.order,
    manifestNumber: raw.manifest,
    timeline: buildTimeline(status)
  };
}

function updateHeaderActions(status) {
  const cancelBtn = document.getElementById("cancelShipmentBtn");
  const printBtn = document.getElementById("printLabelBtn");
  const proofBtn = document.getElementById("proofOfDeliveryBtn");
  if (!cancelBtn || !printBtn || !proofBtn) return;

  const isDelivered = status === "delivered";
  cancelBtn.classList.toggle("hidden", isDelivered);
  printBtn.classList.toggle("hidden", isDelivered);
  proofBtn.classList.toggle("hidden", !isDelivered);

  if (!isDelivered) {
    const enabled = status === "pending_pickup";
    printBtn.disabled = !enabled;
    printBtn.title = enabled
      ? "Print the AWB label for this shipment"
      : "Print Label is only available before the shipment is picked up";
  }
}

function renderTimeline(timeline) {
  document.getElementById("timelineList").innerHTML = timeline
    .map((point) => {
      const classes = ["TrackingTimeline_step"];
      if (point.active) classes.push("active");
      if (point.completed) classes.push("completed");

      let action = "";
      if (point.id === "picked_up" && point.completed) {
        action = `<button type="button" class="TrackingTimeline_actionButton" data-action="proof-of-pickup">View Proof of Pickup</button>`;
      }

      return `<li class="${classes.join(" ")}">${point.label}<div class="timeline-sub">${point.sub}</div>${action}</li>`;
    })
    .join("");
}

function attachTimelineHandlers() {
  const list = document.getElementById("timelineList");
  list.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "proof-of-pickup") {
      window.alert("Proof of pickup would open here.");
    }
  });
}

function attachHeaderActionHandlers() {
  const proofBtn = document.getElementById("proofOfDeliveryBtn");
  if (proofBtn) {
    proofBtn.addEventListener("click", () => {
      window.alert("Proof of delivery would open here.");
    });
  }
}

function render() {
  const shipment = getShipment();
  if (!shipment) {
    document.querySelector(".ShipmentDetail_content").innerHTML =
      '<p style="padding: 24px; color: #6b7280;">Shipment not found.</p>';
    return;
  }
  document.getElementById("breadcrumbAwb").textContent = shipment.awb;
  document.getElementById("shipmentAwb").textContent = shipment.awb;
  const statusEl = document.getElementById("shipmentStatus");
  statusEl.textContent = statusLabels[shipment.status] || shipment.status;
  statusEl.className = `StatusBadge_badge status-${shipment.status}`;
  document.getElementById(
    "orderManifestLine"
  ).textContent = `Order Number ${shipment.orderNumber} \u2022 Manifest Number ${shipment.manifestNumber}`;
  document.getElementById("channelValue").textContent = shipment.channelLabel;
  document.getElementById("quantityValue").textContent = shipment.quantityLabel;
  document.getElementById("weightValue").textContent = shipment.shipmentWeight;
  document.getElementById("orderValue").textContent = shipment.orderValue;
  document.getElementById("paymentMethod").textContent = shipment.paymentMethod;
  document.getElementById("customerName").textContent = shipment.customerName;
  document.getElementById("customerPhone").textContent = shipment.customerPhone;
  document.getElementById("customerAddress").textContent = shipment.customerAddress;
  document.getElementById("driverName").textContent = shipment.driverName;
  document.getElementById("driverPhone").textContent = shipment.driverPhone;

  document.getElementById("itemsBody").innerHTML = shipment.items
    .map(
      (item) =>
        `<tr><td>${item.sku}</td><td>${item.name}</td><td>${item.qty}</td><td>${item.weight}</td></tr>`
    )
    .join("");

  renderTimeline(shipment.timeline);
  updateHeaderActions(shipment.status);
}

render();
attachTimelineHandlers();
attachHeaderActionHandlers();
