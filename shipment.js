const shipmentData = {
  awb: "PH59435762355S",
  orderNumber: "258087932",
  manifestNumber: "MNF-30006",
  status: "pending_pickup",
  channel: "Salla",
  quantity: "1 Items",
  shipmentWeight: "2.4 KG",
  orderValue: "533.09 SAR",
  paymentMethod: "Tamara",
  customerName: "Ahmed Eladl",
  customerPhone: "966534827093",
  customerAddress: "wadi ad-dawasir, sa",
  driverName: "Nadeem Siddque",
  driverPhone: "+966-562443526",
  items: [
    { sku: "SKU-001", name: "Running Shoe", qty: 1, weight: "2.4 KG" }
  ],
  timeline: [
    { label: "Shipment Delivered", sub: "TBD" },
    { label: "Out for Delivery", sub: "TBD" },
    { label: "Shipment Picked up", sub: "TBD" },
    { label: "Shipment Created", sub: "05.05.2026 17:13 EEST", active: true }
  ]
};

const statusLabels = {
  pending_pickup: "Pending Pickup",
  pickup_attempts_exhausted: "Pickup Attempts Exhausted",
  out_for_delivery: "Out for Delivery",
  unable_to_deliver: "Unable to Deliver",
  delivered: "Delivered"
};

function getShipment() {
  const params = new URLSearchParams(window.location.search);
  const awb = params.get("awb");
  if (!awb) return shipmentData;
  return { ...shipmentData, awb };
}

function render() {
  const shipment = getShipment();
  document.getElementById("breadcrumbAwb").textContent = shipment.awb;
  document.getElementById("shipmentAwb").textContent = shipment.awb;
  document.getElementById("shipmentStatus").textContent =
    statusLabels[shipment.status] || shipment.status;
  document.getElementById("shipmentStatus").classList.add(
    `status-${shipment.status}`
  );
  document.getElementById(
    "orderManifestLine"
  ).textContent = `Order Number ${shipment.orderNumber} \u2022 Manifest Number ${shipment.manifestNumber}`;
  document.getElementById("channelValue").textContent = shipment.channel;
  document.getElementById("quantityValue").textContent = shipment.quantity;
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

  document.getElementById("timelineList").innerHTML = shipment.timeline
    .map(
      (point) =>
        `<li class="${point.active ? "active" : ""}">${point.label}<div class="timeline-sub">${point.sub}</div></li>`
    )
    .join("");
}

render();
