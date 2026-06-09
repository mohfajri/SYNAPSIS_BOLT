import React, { useState, useEffect } from "react";
import { 
  Package, 
  ShoppingCart, 
  Truck, 
  ClipboardCheck, 
  FileCheck2, 
  Receipt, 
  Plus, 
  Trash2, 
  Edit3, 
  FileText, 
  Printer, 
  Search, 
  Eye, 
  X, 
  Layers, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  CornerDownRight, 
  ArrowRight,
  Info,
  DollarSign,
  History,
  ArrowLeft
} from "lucide-react";
import { User, Client, AtkItem, AtkOrder, AtkOrderItem, BillingKSO } from "../types";
import { api } from "../lib/api";

interface AtkOrdersViewProps {
  currentUser: User | null;
  clients: Client[];
  onBillingAdded?: () => void; // Trigger callback once bill created
}

export default function AtkOrdersView({ currentUser, clients, onBillingAdded }: AtkOrdersViewProps) {
  // Tabs: 'orders' | 'rekap' | 'master'
  const [activeTab, setActiveTab] = useState<'orders' | 'rekap' | 'master'>('orders');

  // Load States
  const [items, setItems] = useState<AtkItem[]>([]);
  const [orders, setOrders] = useState<AtkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  // Role restriction checks
  const isLogistikUser = currentUser?.role === "Logistik Kantor Pusat" || 
                         currentUser?.role === "Logistik" || 
                         currentUser?.role?.toLowerCase().includes("logistik") ||
                         currentUser?.role === "Administrator" || 
                         currentUser?.role === "Developer";

  // Vendor procurement states
  const [vendorName, setVendorName] = useState("PT. Sinar Jaya Abadi");
  const [vendorOrderNotes, setVendorOrderNotes] = useState("");

  // Search data input autocomplete query
  const [atkSearchQuery, setAtkSearchQuery] = useState("");

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  function triggerConfirm(title: string, message: string, onConfirm: () => void) {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  }

  // Role restriction checks
  const isHQ = currentUser?.role === "Administrator" || 
               currentUser?.role === "Developer" || 
               currentUser?.role === "Project Lead" ||
               currentUser?.role === "Manager" ||
               currentUser?.role === "Manager Keuangan" ||
               currentUser?.role === "Direktur" ||
               currentUser?.role === "Logistik Kantor Pusat";

  const userSite = currentUser?.siteTugas || "";
  const isSiteRestricted = !isHQ && !!userSite && userSite.toLowerCase().trim() !== "kantor pusat";

  // Search & Filter
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [siteFilter, setSiteFilter] = useState<string>("All");

  // Master Katalog States
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  // Master Item Form Fields
  const [itemName, setItemName] = useState("");
  const [itemUnit, setItemUnit] = useState("Rim");
  const [itemPrice, setItemPrice] = useState(0);
  const [itemStock, setItemStock] = useState(100);

  // Separated Menus State for Katalog, Harga, and Stok
  const [masterSubTab, setMasterSubTab] = useState<'katalog' | 'harga' | 'stok'>('katalog');
  const [itemPriceToday, setItemPriceToday] = useState(0);
  const [itemPriceTomorrow, setItemPriceTomorrow] = useState(0);
  const [selectedStockCardItemId, setSelectedStockCardItemId] = useState<string | null>(null);
  const [selectedPriceEditItemId, setSelectedPriceEditItemId] = useState<string | null>(null);
  const [editPriceToday, setEditPriceToday] = useState(0);
  const [editPriceTomorrow, setEditPriceTomorrow] = useState(0);

  // New Order Form States
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderClientRS, setOrderClientRS] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderCart, setOrderCart] = useState<{ item: AtkItem; qty: number }[]>([]);
  const [selectedCartItemId, setSelectedCartItemId] = useState("");
  const [selectedCartItemQty, setSelectedCartItemQty] = useState(1);

  // Active Selected Detail Drawer
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const selectedOrder = orders.find(o => o.id === selectedOrderId) || null;

  // Shipping form fields
  const [shipNotes, setShipNotes] = useState("");
  const [shipQtys, setShipQtys] = useState<Record<string, number>>({});

  // Receipt form fields
  const [receiptNotes, setReceiptNotes] = useState("");
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});

  // Handover (Penyerahan) form fields
  const [fakturNo, setFakturNo] = useState("");
  const [handoverDate, setHandoverDate] = useState(new Date().toISOString().split('T')[0]);

  // Billing Connection states
  const monthsOpt = [
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" }
  ];
  const yearsOpt = Array.from({ length: 11 }, (_, i) => String(2024 + i));

  const [billingPeriod, setBillingPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return String(d.getMonth() + 1).padStart(2, '0');
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    return String(new Date().getFullYear());
  });

  useEffect(() => {
    if (selectedYear && selectedMonth) {
      setBillingPeriod(`${selectedYear}-${selectedMonth}`);
    }
  }, [selectedMonth, selectedYear]);

  const [billingPpnPercent, setBillingPpnPercent] = useState(11);
  const [isLinkingBilling, setIsLinkingBilling] = useState(false);

  // Printing Factur preview
  const [printOrderId, setPrintOrderId] = useState<string | null>(null);
  const printOrder = orders.find(o => o.id === printOrderId) || null;

  // Logistics additional stock and print rekap states
  const [extraStockQuantities, setExtraStockQuantities] = useState<Record<string, number>>({});
  const [vLogisticsCustomItems, setVLogisticsCustomItems] = useState<string[]>([]);
  const [selectedItemForStock, setSelectedItemForStock] = useState<string>("");
  const [printRekapBatchId, setPrintRekapBatchId] = useState<string | null>(null);

  // Initialization Data
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setErrorText("");
    try {
      const [itemsData, ordersData] = await Promise.all([
        api.getAtkItems(),
        api.getAtkOrders()
      ]);
      setItems(itemsData);
      setOrders(ordersData);
      
      // Default Client Assignment
      if (isSiteRestricted) {
        setOrderClientRS(userSite);
      } else if (clients.length > 0) {
        setOrderClientRS(clients[0].namaRS);
      }
    } catch (err: any) {
      console.error(err);
      setErrorText("Gagal memuat data ATK: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Master Katalog handlers
  async function handleCreateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemName.trim()) return;
    try {
      setErrorText("");
      const newItem = await api.createAtkItem({
        name: itemName.trim(),
        unit: itemUnit,
        price: itemPrice,
        stockQty: itemStock,
        createdBy: currentUser?.name || currentUser?.username || "Admin"
      });
      setItems([newItem, ...items]);
      setItemName("");
      setItemPrice(0);
      setItemStock(100);
      setIsAddingItem(false);
    } catch (err: any) {
      setErrorText("Gagal menyimpan katalog: " + err.message);
    }
  }

  async function handleUpdateItem(e: React.FormEvent, id: string) {
    e.preventDefault();
    if (!itemName.trim()) return;
    try {
      setErrorText("");
      const updated = await api.updateAtkItem(id, {
        name: itemName.trim(),
        unit: itemUnit,
        price: itemPrice,
        stockQty: itemStock
      });
      setItems(items.map(it => it.id === id ? updated : it));
      setEditingItemId(null);
      setItemName("");
      setItemPrice(0);
      setItemStock(100);
    } catch (err: any) {
      setErrorText("Gagal mengupdate katalog: " + err.message);
    }
  }

  async function handleDeleteItem(id: string) {
    triggerConfirm(
      "Konfirmasi Hapus Katalog",
      "Apakah Anda yakin ingin menghapus barang ini dari Master Katalog?",
      async () => {
        try {
          setErrorText("");
          setSuccessText("");
          await api.deleteAtkItem(id);
          setItems(items.filter(it => it.id !== id));
          setSuccessText("Barang berhasil dihapus dari Master Katalog!");
        } catch (err: any) {
          setErrorText("Gagal menghapus barang: " + err.message);
        }
      }
    );
  }

  async function handleUpdatePrice(id: string, todayPrice: number, tomorrowPrice: number) {
    try {
      setErrorText("");
      setSuccessText("");
      const updated = await api.updateAtkItem(id, {
        priceToday: todayPrice,
        priceTomorrow: tomorrowPrice,
        price: todayPrice // Sync primary price with today's price
      });
      setItems(items.map(it => it.id === id ? updated : it));
      setSuccessText(`🎉 Sukses mengupdate periode harga untuk ${updated.name}!`);
    } catch (err: any) {
      setErrorText("Gagal menyimpan harga baru: " + err.message);
    }
  }

  // Cart Management for New Order
  function addToCart() {
    if (!selectedCartItemId) return;
    const item = items.find(i => i.id === selectedCartItemId);
    if (!item) return;

    // Check if food/goods already exist
    const existingIdx = orderCart.findIndex(c => c.item.id === selectedCartItemId);
    if (existingIdx > -1) {
      const updated = [...orderCart];
      updated[existingIdx].qty += selectedCartItemQty;
      setOrderCart(updated);
    } else {
      setOrderCart([...orderCart, { item, qty: selectedCartItemQty }]);
    }
    setSelectedCartItemQty(1);
  }

  function removeFromCart(idx: number) {
    setOrderCart(orderCart.filter((_, i) => i !== idx));
  }

  // Order Operations
  async function handleCreateOrder(isDraft: boolean) {
    if (!isDraft && isLogistikUser) {
      setErrorText("Role Logistik tidak diperkenankan untuk mengajukan pemesanan dari site!");
      return;
    }
    if (orderCart.length === 0) {
      setErrorText("Silakan masukkan minimal satu barang ke dalam draf pemesanan!");
      return;
    }
    try {
      setLoading(true);
      setErrorText("");
      setSuccessText("");

      const orderedItems: AtkOrderItem[] = orderCart.map(c => {
        const activePrice = c.item.priceToday !== undefined && c.item.priceToday > 0 ? c.item.priceToday : c.item.price;
        return {
          itemId: c.item.id,
          name: c.item.name,
          unit: c.item.unit,
          qtyOrdered: c.qty,
          qtyShipped: 0,
          qtyReceived: 0,
          price: activePrice
        };
      });

      const newOrd = await api.createAtkOrder({
        clientRS: orderClientRS,
        orderDate,
        status: isDraft ? 'Draft' : 'Diajukan',
        items: orderedItems,
        createdBy: currentUser?.name || currentUser?.username || "User Site"
      });

      setOrders([newOrd, ...orders]);
      setOrderCart([]);
      setIsCreatingOrder(false);
      setSuccessText(isDraft ? "Pemesanan berhasil disimpan sebagai Draf!" : "Pemesanan berhasil diajukan ke Kantor Pusat!");
    } catch (err: any) {
      setErrorText("Gagal membuat pemesanan: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Vendor Procurement Handlers
  async function handleConfirmVendorProcurement() {
    const unrecappedOrders = orders.filter(o => o.status === 'Diajukan' && !o.rekapId);
    if (unrecappedOrders.length === 0) {
      alert("Tidak ada pemesanan 'Diajukan' yang belum direkap untuk diproses ke vendor.");
      return;
    }
    setLoading(true);
    setErrorText("");
    setSuccessText("");
    try {
      // Find maximum numeric rekap ID to auto-increment
      const existingRekaps = Array.from(new Set(orders.map(o => o.rekapId).filter(Boolean)));
      let maxNum = 0;
      existingRekaps.forEach((rk: any) => {
        const matches = rk.match(/RKP-(\d+)/);
        if (matches && matches[1]) {
          const num = parseInt(matches[1]);
          if (num > maxNum) maxNum = num;
        }
      });
      const nextNumber = maxNum + 1;
      const generatedRekapId = `RKP-${String(nextNumber).padStart(3, '0')}`;

      await Promise.all(
        unrecappedOrders.map(async (ord) => {
          await api.updateAtkOrder(ord.id, {
            rekapId: generatedRekapId,
            vendorStatus: "Dipesan ke Vendor",
            vendorName: vendorName,
            vendorNotes: vendorOrderNotes,
            vendorProcuredDate: new Date().toISOString().split('T')[0]
          });
        })
      );

      // Create a dedicated order for SCM logistics additional stock items under this rekapId if they exist
      const extraItems = Object.entries(extraStockQuantities)
        .filter(([_, qty]) => (qty as number) > 0)
        .map(([itemId, qty]) => {
          const itemInfo = items.find(i => i.id === itemId);
          return {
            itemId,
            name: itemInfo?.name || "Item SCM",
            unit: itemInfo?.unit || "Unit",
            qtyOrdered: qty as number,
            qtyShipped: 0,
            qtyReceived: 0,
            price: itemInfo?.priceToday || itemInfo?.price || 0
          };
        });

      if (extraItems.length > 0) {
        await api.createAtkOrder({
          clientRS: "GUDANG PUSAT SCM (Penyediaan Stok)",
          orderDate: new Date().toISOString().split('T')[0],
          status: 'Diajukan',
          rekapId: generatedRekapId,
          items: extraItems,
          createdBy: currentUser?.name || currentUser?.username || "Logistik Kantor Pusat",
          vendorStatus: "Dipesan ke Vendor",
          vendorName: vendorName,
          vendorNotes: vendorOrderNotes,
          vendorProcuredDate: new Date().toISOString().split('T')[0]
        });
      }

      // Reset logistics custom states
      setExtraStockQuantities({});
      setVLogisticsCustomItems([]);

      setSuccessText(`🎉 Pengadaan kolektif baru ${generatedRekapId} ke Vendor ${vendorName} Berhasil Dikonfirmasi! Status terpantau di monitoring.`);
      await fetchData();
    } catch (err: any) {
      setErrorText("Gagal memproses pengadaan vendor: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmOrderArrival(order: AtkOrder) {
    setLoading(true);
    setErrorText("");
    setSuccessText("");
    try {
      // 1. Update master inventory stock level for each item in the order
      await Promise.all(
        order.items.map(async (it) => {
          const matchedItem = items.find(item => item.id === it.itemId);
          const currentStock = matchedItem?.stockQty || 0;
          await api.updateAtkItem(it.itemId, {
            stockQty: currentStock + it.qtyOrdered
          });
        })
      );

      // 2. Update order's vendorStatus to "Barang Masuk Gudang Pusat" and log real arrival date/time
      await api.updateAtkOrder(order.id, {
        vendorStatus: "Barang Masuk Gudang Pusat",
        vendorArrivedDate: new Date().toLocaleString('id-ID')
      });

      setSuccessText(`🎉 Barang untuk pemesanan ${order.noPemesanan} (${order.clientRS}) telah terkonfirmasi masuk stok SCM!`);
      await fetchData();
    } catch (err: any) {
      setErrorText("Gagal merekap barang masuk vendor: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmVendorArrival() {
    // Retained as a fallback bulk confirming action for all remaining pending orders
    const pendingOrders = orders.filter(o => o.status === 'Diajukan' && o.vendorStatus !== 'Barang Masuk Gudang Pusat');
    if (pendingOrders.length === 0) {
      alert("Tidak ada pemesanan 'Diajukan' untuk diproses masuk stok.");
      return;
    }
    setLoading(true);
    setErrorText("");
    setSuccessText("");
    try {
      const totalsNeeded: Record<string, number> = {};
      pendingOrders.forEach(ord => {
        ord.items.forEach(it => {
          totalsNeeded[it.itemId] = (totalsNeeded[it.itemId] || 0) + it.qtyOrdered;
        });
      });

      await Promise.all(
        Object.entries(totalsNeeded).map(async ([itemId, qty]) => {
          const matchedItem = items.find(it => it.id === itemId);
          const currentStock = (matchedItem as any)?.stockQty || 0;
          await api.updateAtkItem(itemId, {
            stockQty: currentStock + qty
          });
        })
      );

      await Promise.all(
        pendingOrders.map(async (ord) => {
          await api.updateAtkOrder(ord.id, {
            vendorStatus: "Barang Masuk Gudang Pusat",
            vendorArrivedDate: new Date().toISOString().split('T')[0]
          });
        })
      );

      setSuccessText("🎉 Barang dari Vendor berhasil masuk ke Stok Gudang Logistik Pusat! Stok terupdate otomatis.");
      await fetchData();
    } catch (err: any) {
      setErrorText("Gagal merekap barang masuk vendor: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Promote Draft Order to Submitted
  async function handleAjukanOrder(order: AtkOrder) {
    if (isLogistikUser) {
      setErrorText("Role Logistik tidak diperkenankan untuk mengajukan pemesanan dari site!");
      return;
    }
    triggerConfirm(
      "Ajukan Pemesanan ATK",
      "Apakah Anda yakin ingin mengajukan pemesanan ini ke Kantor Pusat?",
      async () => {
        try {
          setLoading(true);
          setErrorText("");
          setSuccessText("");
          const updated = await api.updateAtkOrder(order.id, {
            status: 'Diajukan'
          });
          setOrders(orders.map(o => o.id === order.id ? updated : o));
          if (selectedOrderId === order.id) setSelectedOrderId(null);
          setSuccessText("Pemesanan telah berhasil diajukan ke Kantor Pusat!");
        } catch (err: any) {
          setErrorText("Gagal mengajukan pemesanan: " + err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  }

  // Dispatch details initialization
  useEffect(() => {
    if (selectedOrder && selectedOrder.status === 'Diajukan') {
      const initialShipped: Record<string, number> = {};
      selectedOrder.items.forEach(it => {
        initialShipped[it.itemId] = it.qtyOrdered;
      });
      setShipQtys(initialShipped);
      setShipNotes("");
    } else if (selectedOrder && selectedOrder.status === 'Dikirim') {
      const initialReceived: Record<string, number> = {};
      selectedOrder.items.forEach(it => {
        initialReceived[it.itemId] = it.qtyShipped;
      });
      setReceivedQtys(initialReceived);
      setReceiptNotes("");
    } else if (selectedOrder && selectedOrder.status === 'Diterima') {
      // Auto sequence for Faktur
      const randSeed = Math.floor(100 + Math.random() * 900);
      setFakturNo(`FAK-ATK/${new Date().getFullYear()}/${randSeed}`);
    }
  }, [selectedOrderId]);

  // Shipping Submission (HQ)
  async function handleKonfirmasiPengiriman() {
    if (!selectedOrder) return;
    try {
      setLoading(true);
      setErrorText("");
      setSuccessText("");

      const updatedItems = selectedOrder.items.map(it => ({
        ...it,
        qtyShipped: shipQtys[it.itemId] !== undefined ? shipQtys[it.itemId] : it.qtyOrdered
      }));

      // Deduct from Central Stock
      await Promise.all(
        updatedItems.map(async (it) => {
          const matchedItem = items.find(catIt => catIt.id === it.itemId);
          if (matchedItem) {
            const currentStock = (matchedItem as any).stockQty !== undefined ? (matchedItem as any).stockQty : 100;
            const newStock = Math.max(0, currentStock - it.qtyShipped);
            await api.updateAtkItem(it.itemId, {
              stockQty: newStock
            });
          }
        })
      );

      // Refresh catalog items state to show newly updated stocks
      const itemsData = await api.getAtkItems();
      setItems(itemsData);

      const updated = await api.updateAtkOrder(selectedOrder.id, {
        status: 'Dikirim',
        items: updatedItems,
        shippedDate: new Date().toISOString().split('T')[0],
        shippedBy: currentUser?.name || currentUser?.username || "Kantor Pusat",
        deliveryNotes: shipNotes
      });

      setOrders(orders.map(o => o.id === selectedOrder.id ? updated : o));
      setSelectedOrderId(null);
      setSuccessText("Pengiriman ATK berhasil dikonfirmasi dan status terupdate menjadi 'Dikirim'!");
    } catch (err: any) {
      setErrorText("Gagal mengonfirmasi pengiriman: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Receipt Submission (Site)
  async function handleKonfirmasiPenerimaan() {
    if (!selectedOrder) return;
    if (isLogistikUser) {
      setErrorText("Role Logistik tidak diperkenankan mengonfirmasi penerimaan barang di site!");
      return;
    }
    try {
      setLoading(true);
      setErrorText("");
      setSuccessText("");

      const updatedItems = selectedOrder.items.map(it => ({
        ...it,
        qtyReceived: receivedQtys[it.itemId] !== undefined ? receivedQtys[it.itemId] : it.qtyShipped
      }));

      const updated = await api.updateAtkOrder(selectedOrder.id, {
        status: 'Diterima',
        items: updatedItems,
        receivedDate: new Date().toISOString().split('T')[0],
        receivedBy: currentUser?.name || currentUser?.username || "User Site",
        receiptNotes
      });

      setOrders(orders.map(o => o.id === selectedOrder.id ? updated : o));
      setSelectedOrderId(null);
      setSuccessText("Penerimaan barang telah dikonfirmasi! Barang siap didistribusikan & diserahkan ke pihak RS.");
    } catch (err: any) {
      setErrorText("Gagal mengonfirmasi penerimaan: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handover to Hospital RS with Temporary Invoice
  async function handleKonfirmasiPenyerahanRS() {
    if (!selectedOrder) return;
    if (!fakturNo.trim()) {
      setErrorText("Mohon masukkan nomor faktur sementara!");
      return;
    }
    try {
      setLoading(true);
      setErrorText("");
      setSuccessText("");

      const updated = await api.updateAtkOrder(selectedOrder.id, {
        status: 'Diserahkan',
        fakturSementaraNo: fakturNo.trim(),
        deliveredToRSDate: handoverDate,
        deliveredToRSBy: currentUser?.name || currentUser?.username || "Site Coordinator"
      });

      setOrders(orders.map(o => o.id === selectedOrder.id ? updated : o));
      setSelectedOrderId(null);
      setSuccessText(`Serah terima ke pihak RS Sukses dengan bukti Faktur Sementara: ${fakturNo.trim()}`);
    } catch (err: any) {
      setErrorText("Gagal mengonfirmasi penyerahan RS: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Generate ATK Billing Connection
  async function handleKoneksikanBilling() {
    if (!selectedOrder) return;
    if (!billingPeriod) {
      setErrorText("Pilih periode bulan penagihan di RS!");
      return;
    }
    try {
      setLoading(true);
      setErrorText("");
      setSuccessText("");

      // Compute total sum from accepted items
      const serviceAmount = selectedOrder.items.reduce((sum, it) => sum + (it.qtyReceived * it.price), 0);
      const ppnPercent = billingPpnPercent;
      const ppnAmount = Math.round((serviceAmount * ppnPercent) / 100);
      const totalAmount = serviceAmount + ppnAmount;

      // 1. Post new billing ATK
      const newBill = await api.createBilling({
        type: 'ATK',
        clientRS: selectedOrder.clientRS,
        periodMonth: billingPeriod,
        serviceAmount,
        ppnPercent,
        ppnAmount,
        totalAmount,
        description: JSON.stringify({
          isAtkDetailed: true,
          originalDescription: `Pengadaan retail ATK Penunjang Kantor RS sesuai Faktur Penyerahan Sementara No. ${selectedOrder.fakturSementaraNo || selectedOrder.noPemesanan}`,
          noFakturSementara: selectedOrder.fakturSementaraNo || selectedOrder.noPemesanan,
          items: selectedOrder.items
        }),
        status: 'Draft',
        submittedAt: new Date().toISOString(),
        submittedBy: currentUser?.username || "logistics",
        namaPerusahaanSite: "PT. Medika KSO Indonesia"
      });

      // 2. Put order to Billed with linked billing ID
      const updatedOrder = await api.updateAtkOrder(selectedOrder.id, {
        status: 'Billed',
        billingKsoId: newBill.id
      });

      setOrders(orders.map(o => o.id === selectedOrder.id ? updatedOrder : o));
      setSelectedOrderId(null);
      setIsLinkingBilling(false);
      
      // Fire callback if exist to reload billing lists
      if (onBillingAdded) {
        onBillingAdded();
      }

      setSuccessText("🎉 Sukses tersinkronisasi! Penagihan ATK telah didaftarkan dalam modul Billing.");
    } catch (err: any) {
      setErrorText("Gagal mengkoneksikan ke Billing: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Delete Order
  async function handleDeleteOrder(id: string) {
    triggerConfirm(
      "Hapus Pengajuan ATK",
      "Apakah Anda yakin ingin menghapus data pengajuan pemesanan ATK ini?",
      async () => {
        try {
          setLoading(true);
          setErrorText("");
          setSuccessText("");
          await api.deleteAtkOrder(id);
          setOrders(orders.filter(o => o.id !== id));
          if (selectedOrderId === id) setSelectedOrderId(null);
          setSuccessText("Pengajuan pemesanan ATK berhasil dihapus.");
        } catch (err: any) {
          setErrorText("Gagal menghapus order: " + err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  }

  // Filters calculation
  const displayedOrders = orders.filter(o => {
    // Draft status filter can ONLY be seen on the originating site level
    if (o.status === "Draft") {
      if (!isSiteRestricted || o.clientRS.toLowerCase().trim() !== userSite.toLowerCase().trim()) {
        return false;
      }
    }

    // Site Restriction filter
    if (isSiteRestricted && o.clientRS.toLowerCase().trim() !== userSite.toLowerCase().trim()) {
      return false;
    }
    
    // UI filters
    if (statusFilter !== "All" && o.status !== statusFilter) return false;
    if (siteFilter !== "All" && o.clientRS !== siteFilter) return false;
    
    if (orderSearch) {
      const q = orderSearch.toLowerCase();
      return (
        o.noPemesanan.toLowerCase().includes(q) ||
        o.clientRS.toLowerCase().includes(q) ||
        (o.fakturSementaraNo && o.fakturSementaraNo.toLowerCase().includes(q))
      );
    }

    return true;
  });

  const totalCost = (ord: AtkOrder) => {
    return ord.items.reduce((sum, item) => sum + (item.qtyOrdered * item.price), 0);
  };

  const actualCost = (ord: AtkOrder) => {
    // Use received qty if available, fallback to shipped qty, fallback to ordered qty
    return ord.items.reduce((sum, item) => {
      const qty = ord.status === 'Billed' || ord.status === 'Diserahkan' || ord.status === 'Diterima' 
        ? item.qtyReceived 
        : (ord.status === 'Dikirim' ? item.qtyShipped : item.qtyOrdered);
      return sum + (qty * item.price);
    }, 0);
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div id="atk-orders-container" className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Pemesanan & Distribusi ATK Kantor</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isSiteRestricted 
              ? `Pengadaan & pengiriman alat tulis kantor penunjang operasional KSO - Site RS ${userSite}` 
              : "Manajemen rantai pasok ATK, pemesanan site, pengiriman pusat, sampai koneksi billing tagihan RS."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSiteRestricted && !isLogistikUser && (
            <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-black border border-blue-200/50 px-3 py-1.5 rounded-lg uppercase tracking-wider">
              Site: {userSite}
            </span>
          )}
          
          {isSiteRestricted && !isLogistikUser && (
            <button
              onClick={() => {
                setErrorText("");
                setIsCreatingOrder(true);
                setOrderCart([]);
                setAtkSearchQuery("");
                setSelectedCartItemId("");
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md hover:scale-[1.02] active:scale-95 flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Buat Pemesanan</span>
            </button>
          )}
        </div>
      </div>

      {/* ERROR BADGE */}
      {errorText && (
        <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 p-4 rounded-xl text-xs font-semibold flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{errorText}</span>
        </div>
      )}

      {/* SUCCESS BADGE */}
      {successText && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-xl text-xs font-semibold flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{successText}</span>
        </div>
      )}

      {/* TAB SELECTOR */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => { setActiveTab('orders'); setErrorText(""); }}
          className={`px-4 py-3 text-xs font-extrabold border-b-2 tracking-wide transition-all uppercase flex items-center gap-2 cursor-pointer ${activeTab === 'orders' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-350'}`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Alur & Daftar Pemesanan</span>
          <span className="ml-1 px-2 py-0.5 text-[10px] bg-indigo-50 text-indigo-600 rounded-full dark:bg-indigo-950 dark:text-indigo-400 font-mono">
            {orders.length}
          </span>
        </button>

        {(isHQ || isLogistikUser) && (
          <button
            onClick={() => { setActiveTab('rekap'); setErrorText(""); }}
            className={`px-4 py-3 text-xs font-extrabold border-b-2 tracking-wide transition-all uppercase flex items-center gap-2 cursor-pointer ${activeTab === 'rekap' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-350'}`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Rekap & Pengadaan Vendor</span>
            <span className="ml-1 px-2 py-0.5 text-[10px] bg-amber-50 text-amber-700 rounded-full dark:bg-amber-950 dark:text-amber-400 font-mono">
              {orders.filter(o => o.status === 'Diajukan').length}
            </span>
          </button>
        )}

        {isLogistikUser && (
          <button
            onClick={() => { setActiveTab('master'); setErrorText(""); }}
            className={`px-4 py-3 text-xs font-extrabold border-b-2 tracking-wide transition-all uppercase flex items-center gap-2 cursor-pointer ${activeTab === 'master' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-350'}`}
          >
            <Layers className="w-4 h-4" />
            <span>Katalog Master Unit ATK</span>
            <span className="ml-1 px-2 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded-full dark:bg-slate-800 dark:text-slate-400 font-mono">
              {items.length}
            </span>
          </button>
        )}
      </div>

      {loading && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Sedang memproses & sinkronisasi data...</p>
        </div>
      )}

      {/* VIEW: CREATE ATK ORDER FORM (DEDICATED INLINE WORKSPACE) */}
      {!loading && activeTab === 'orders' && isCreatingOrder && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Formulir Pembuatan Pemesanan ATK Baru</h3>
              </div>
              <button
                onClick={() => setIsCreatingOrder(false)}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-650 dark:text-slate-200 font-extrabold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
                <span>Batal / Kembali</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Pilih Site RS Tujuan Pengadaan <span className="text-red-500">*</span></label>
                {isSiteRestricted ? (
                  <input
                    type="text"
                    disabled
                    value={orderClientRS}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-202 dark:border-slate-800 text-xs font-bold rounded-lg px-3 py-2 text-slate-600"
                  />
                ) : (
                  <select
                    value={orderClientRS}
                    onChange={(e) => setOrderClientRS(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-202 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-indigo-505"
                  >
                    {clients.map(cl => (
                      <option key={cl.id} value={cl.namaRS}>{cl.namaRS}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tanggal Pemesanan / Pengajuan <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  required
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-202 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs font-black focus:outline-none focus:border-indigo-505"
                />
              </div>
            </div>

            {/* RETAIL CART ADD ITEMS INLINE WITH SEARCHABLE AUTOCOMPLETE */}
            <div className="bg-slate-50 dark:bg-slate-950/40 p-5 border border-slate-200 dark:border-slate-805 rounded-2xl space-y-4">
              <span className="text-[10px] uppercase tracking-widest font-black text-indigo-650 dark:text-indigo-400 block">🛍️ Pencarian & Input Barang ATK</span>
              
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 relative">
                  <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Cari Nama ATK <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Ketikan kata kunci (Contoh: Kertas, Box, Ribbon)..."
                      value={atkSearchQuery}
                      onChange={(e) => setAtkSearchQuery(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-800 text-slate-905 dark:text-slate-100 rounded-lg pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-indigo-505 font-extrabold"
                    />
                  </div>

                  {/* Filter suggestions dropdown */}
                  {atkSearchQuery.trim().length > 0 && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-xl max-h-56 overflow-y-auto shadow-xl z-50 divide-y divide-slate-100 dark:divide-slate-800">
                      {items
                        .filter(it => it.name.toLowerCase().includes(atkSearchQuery.toLowerCase()))
                        .map(it => (
                          <button
                            key={it.id}
                            type="button"
                            onClick={() => {
                              setSelectedCartItemId(it.id);
                              setAtkSearchQuery(`${it.name} [${it.unit}]`);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-850 font-bold text-xs flex justify-between items-center transition-colors"
                          >
                            <span className="text-slate-850 dark:text-white">{it.name} <span className="text-[9px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350 px-1 py-0.5 rounded font-black uppercase">{it.unit}</span></span>
                            <span className="font-mono text-indigo-600 dark:text-indigo-400">{formatIDR(it.price)}</span>
                          </button>
                        ))}
                      {items.filter(it => it.name.toLowerCase().includes(atkSearchQuery.toLowerCase())).length === 0 && (
                        <div className="p-3 text-center text-xs text-slate-400 italic">Barang tidak ditemukan dalam katalog master</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-full sm:w-28">
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Jumlah</label>
                  <input
                    type="number"
                    min="1"
                    value={selectedCartItemQty}
                    onChange={(e) => setSelectedCartItemQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-center font-black"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    addToCart();
                    setAtkSearchQuery("");
                  }}
                  className="bg-indigo-600 hover:bg-indigo-755 text-white font-black text-xs px-5 py-2.5 rounded-lg cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambahkan</span>
                </button>
              </div>
            </div>

            {/* CART ITEMS REGISTERED TABLE */}
            <div className="border border-slate-150 dark:border-slate-850 rounded-xl overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-950 px-4 py-2 font-black text-[9px] text-slate-450 uppercase border-b border-slate-150 dark:border-slate-850 tracking-wider">
                🛒 Keranjang Draf Belanja ATK ({orderCart.length} item)
              </div>
              {orderCart.length === 0 ? (
                <div className="p-12 text-center text-slate-400 italic text-xs">
                  Keranjang masih kosong. Cari barang standar ATK di atas kemudian tekan "Tambahkan".
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-955 text-slate-400 font-bold text-[9px] uppercase tracking-wider border-b">
                      <th className="p-3 pl-4">Nama Barang</th>
                      <th className="p-3 text-center">Jumlah Pesanan</th>
                      <th className="p-3">Harga Vendor Satuan</th>
                      <th className="p-3">Subtotal</th>
                      <th className="p-3 pr-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {orderCart.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/20">
                        <td className="p-3 pl-4 font-extrabold text-slate-850 dark:text-slate-150">{c.item.name}</td>
                        <td className="p-3 text-center font-mono font-black text-indigo-650 dark:text-indigo-405">{c.qty} {c.item.unit}</td>
                        <td className="p-3 font-mono text-slate-500">{formatIDR(c.item.price)}</td>
                        <td className="p-3 font-mono font-black text-slate-800 dark:text-slate-200">{formatIDR(c.qty * c.item.price)}</td>
                        <td className="p-3 pr-4 text-center">
                          <button
                            type="button"
                            onClick={() => removeFromCart(idx)}
                            className="text-red-500 hover:bg-red-100/50 p-1 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* TOTALS & FORM BLOCK ACTIONS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100/60 dark:border-slate-850">
              <div>
                <span className="text-[10px] uppercase font-black text-slate-400 block">Total Estimasi Anggaran Belanja ATK:</span>
                <span className="font-mono text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {formatIDR(orderCart.reduce((sum, c) => sum + (c.qty * c.item.price), 0))}
                </span>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => handleCreateOrder(true)}
                  className="bg-slate-200 hover:bg-slate-250 text-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-all"
                >
                  Simpan Draf Lokal 💾
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateOrder(false)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-6 py-2.5 rounded-xl cursor-pointer transition-all shadow-md uppercase tracking-wider"
                >
                  Ajukan Pemesanan Ke Pusat 🚀
                </button>
              </div>
            </div>
          </div>
        )}

      {/* VIEW: ORDER LISTS & FLOW TABLE */}
      {!loading && activeTab === 'orders' && !isCreatingOrder && (
        <div className={selectedOrderId ? "block w-full" : "grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"}>
          
          {/* ORDERS TABLE COLUMN */}
          <div className={selectedOrderId ? "hidden" : "lg:col-span-2 space-y-4"}>
            
            {/* SEARCH & FILTERS */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nomor pemesanan atau nama RS..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 placeholder-slate-400 text-xs rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-600 dark:text-slate-350 focus:outline-none"
                >
                  <option value="All">Semua Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Diajukan">Diajukan (Pusat)</option>
                  <option value="Dikirim">Dikirim</option>
                  <option value="Diterima">Diterima</option>
                  <option value="Diserahkan">Diserahkan ke RS</option>
                  <option value="Billed">Terkoneksi Billing</option>
                </select>

                {!isSiteRestricted && (
                  <select
                    value={siteFilter}
                    onChange={(e) => setSiteFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-600 dark:text-slate-350 focus:outline-none max-w-[180px]"
                  >
                    <option value="All">Semua Site RS</option>
                    {clients.map(cl => (
                      <option key={cl.id} value={cl.namaRS}>{cl.namaRS}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* ORDERS TABLE LIST */}
            {displayedOrders.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <ShoppingCart className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Tidak ada pengajuan pemesanan ATK ditemukan</p>
                <p className="text-[11px] text-slate-405 mt-1">Silakan klik "Buat Pemesanan" untuk mendaftarkan logistik barang baru.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedOrders.map(order => {
                  const itemsCount = order.items.length;
                  const valueCalculated = actualCost(order);
                  const isSelected = selectedOrderId === order.id;

                  return (
                    <div 
                      key={order.id}
                      className={`p-4 bg-white dark:bg-slate-900 border rounded-xl hover:shadow-xs transition-all ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200 dark:border-slate-800'}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 select-all">
                              {order.noPemesanan}
                            </span>
                            
                            {/* Badges for status */}
                            {order.status === 'Draft' && (
                              <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-450 border border-slate-200 dark:border-slate-750 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">Draf</span>
                            )}
                            {order.status === 'Diajukan' && (
                              <span className="bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-450 border border-orange-200/50 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase animate-pulse">Diajukan</span>
                            )}
                            {order.status === 'Dikirim' && (
                              <span className="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/50 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">Dalam Pengiriman</span>
                            )}
                            {order.status === 'Diterima' && (
                              <span className="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/50 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">Diterima di Site</span>
                            )}
                            {order.status === 'Diserahkan' && (
                              <span className="bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200/50 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">Diserahkan ke RS</span>
                            )}
                            {order.status === 'Billed' && (
                              <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">Terkoneksi Invoice</span>
                            )}
                          </div>
                          
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>RS / Client: {order.clientRS}</span>
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-[10px] text-slate-400">Estimasi Pengadaan (Akurasi Real):</p>
                          <p className="text-xs font-black text-slate-920 dark:text-slate-100 font-mono">
                            {formatIDR(valueCalculated)}
                          </p>
                        </div>
                      </div>

                      {/* Summary lines */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-500 mb-3 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                        <div>
                          <span className="font-bold">Tanggal Pemesanan:</span>
                          <span className="block font-mono text-slate-700 dark:text-slate-350">{order.orderDate}</span>
                        </div>
                        <div>
                          <span className="font-bold">Jumlah Barang:</span>
                          <span className="block text-slate-700 dark:text-slate-350">{itemsCount} jenis ({order.items.reduce((sum, item) => sum + item.qtyOrdered, 0)} Pcs/Rim)</span>
                        </div>
                        <div>
                          <span className="font-bold">Faktur Sementara Ke RS:</span>
                          <span className="block font-sans text-slate-700 dark:text-slate-350 truncate">
                            {order.fakturSementaraNo ? `🧾 ${order.fakturSementaraNo}` : "- Belum dibuat -"}
                          </span>
                        </div>
                      </div>

                      {/* Timeline status track bar */}
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest py-1 border-t border-slate-100 dark:border-slate-800/80 mt-2">
                        <span className={order.status !== 'Draft' ? "text-indigo-600 dark:text-indigo-400" : ""}>Request</span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-300" />
                        <span className={order.status === 'Dikirim' || order.status === 'Diterima' || order.status === 'Diserahkan' || order.status === 'Billed' ? "text-indigo-600" : ""}>Kirim (HQ)</span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-300" />
                        <span className={order.status === 'Diterima' || order.status === 'Diserahkan' || order.status === 'Billed' ? "text-indigo-600" : ""}>Terima (Site)</span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-300" />
                        <span className={order.status === 'Diserahkan' || order.status === 'Billed' ? "text-indigo-600" : ""}>Serah RS</span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-300" />
                        <span className={order.status === 'Billed' ? "text-emerald-600" : ""}>Billing</span>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/50 mt-3">
                        <div className="text-[10px] text-slate-400 font-semibold">
                          Diajukan oleh: <span className="text-slate-600 dark:text-slate-300">{order.createdBy || "Logistik"}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {order.status === 'Draft' && (
                            <button
                              onClick={() => handleAjukanOrder(order)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10.5px] font-black px-2.5 py-1 rounded-md cursor-pointer transition-colors"
                            >
                              Ajukan Sekarang 🚀
                            </button>
                          )}

                          {order.status === 'Diserahkan' && (
                            <button
                              onClick={() => {
                                setSelectedOrderId(order.id);
                                setIsLinkingBilling(true);
                                setBillingPeriod(new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' }));
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-extrabold px-2.5 py-1 rounded-md cursor-pointer transition-all shadow-md"
                            >
                              🚀 Buat Billing Invoice
                            </button>
                          )}

                          {order.fakturSementaraNo && (
                            <button
                              onClick={() => setPrintOrderId(order.id)}
                              title="Cetak Faktur Sementara Penyerahan RS"
                              className="bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-750 p-1.5 rounded-lg cursor-pointer transition-all"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedOrderId(order.id);
                              setIsLinkingBilling(false);
                            }}
                            className="bg-indigo-700 text-white hover:bg-indigo-800 text-[10.5px] font-bold px-3 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Proses Detail</span>
                          </button>

                          {order.status === 'Draft' && (
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 p-1.5 rounded cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT ACTION COLUMN / DRAWER DETAILS */}
          <div className={selectedOrderId ? "w-full" : "space-y-4"}>
            
            {/* INSTRUCTIONS ON WORKFLOW ATK */}
            {!selectedOrderId && (
              <div className="bg-indigo-50/50 dark:bg-indigo-950/15 p-5 border border-indigo-150 dark:border-indigo-900/30 rounded-2xl space-y-3">
                <h3 className="text-xs font-black text-indigo-750 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1 text-indigo-700">
                  <Info className="w-4 h-4" />
                  <span>Alur Siklus ATK</span>
                </h3>
                <ul className="text-[11px] text-slate-600 dark:text-slate-350 space-y-2 list-none">
                  <li className="flex items-start gap-1.5">
                    <span className="bg-indigo-600 text-white rounded-full w-4.5 h-4.5 text-[9px] font-extrabold inline-flex items-center justify-center shrink-0">1</span>
                    <span><b>Pengajuan Site:</b> Site Coordinator menginput list barang yang dibutuhkan dan mengajukan ke Pusat.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="bg-indigo-600 text-white rounded-full w-4.5 h-4.5 text-[9px] font-extrabold inline-flex items-center justify-center shrink-0">2</span>
                    <span><b>Pengiriman Pusat:</b> Kantor Pusat menyiapkan logistik, mengubah qty pengiriman riil (jika disesuaikan), dan mengirimkannya.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="bg-indigo-700 text-white rounded-full w-4.5 h-4.5 text-[9px] font-extrabold inline-flex items-center justify-center shrink-0">3</span>
                    <span><b>Penerimaan Barang:</b> Site Coordinator memverifikasi kualitas barang saat sampai di site RS dan mengonfirmasi terima.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="bg-indigo-750 text-white rounded-full w-4.5 h-4.5 text-[9px] font-extrabold inline-flex items-center justify-center shrink-0">4</span>
                    <span><b>Penyerahan ke RS:</b> Penyerahan resmi ke RS dengan menginput Tanda Terima dan mencetak Faktur Sementara.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="bg-emerald-600 text-white rounded-full w-4.5 h-4.5 text-[9px] font-extrabold inline-flex items-center justify-center shrink-0">5</span>
                    <span><b>Koneksi Billing:</b> Mengubah penyerahan ATK menjadi Draft Billing untuk diproses ke pencairan tagihan oleh Keuangan.</span>
                  </li>
                </ul>
              </div>
            )}

            {/* IF DETAIL CHOSEN */}
            {selectedOrderId && selectedOrder && (
              <div className="space-y-6 text-slate-800 dark:text-slate-100">
                
                {/* Back Navigation Bar / Page Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setSelectedOrderId(null); setIsLinkingBilling(false); }}
                      className="bg-white hover:bg-slate-100 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                    >
                      <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>← Kembali ke Daftar Pemesanan</span>
                    </button>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block"></div>
                    <div>
                      <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                        <FileText className="w-4 h-4 text-indigo-505" />
                        <span>Rincian & Aksi: {selectedOrder.noPemesanan}</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">RS/Client: <b className="text-slate-700 dark:text-slate-300">{selectedOrder.clientRS}</b></p>
                    </div>
                  </div>
                  
                  {selectedOrder.fakturSementaraNo && (
                    <button
                      onClick={() => setPrintOrderId(selectedOrder.id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Cetak Faktur Sementara</span>
                    </button>
                  )}
                </div>

                {/* Main Wide Two-Column Split (List of Items vs Timeline Actions) */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                  
                  {/* LEFT SUB-COLUMN: LARGE LIST OF ITEMS (takes 3/5 cols) */}
                  <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">📋 Ringkasan Barang Belanja</span>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">Kuantitas pengadaan riil disesuaikan oleh SCM pusat & site</p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[400px]">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] font-bold uppercase select-none">
                            <th className="py-2.5">Nama Barang</th>
                            <th className="py-2.5 text-right">Harga Satuan</th>
                            <th className="py-2.5 text-center">Qty Target</th>
                            <th className="py-2.5 text-center font-bold text-orange-600">Dikirim (SCM)</th>
                            <th className="py-2.5 text-center font-bold text-indigo-600">Diterima (Site)</th>
                            <th className="py-2.5 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-850/65 font-medium">
                          {selectedOrder.items.map(it => {
                            const activeQty = it.qtyReceived > 0 
                              ? it.qtyReceived 
                              : (it.qtyShipped !== undefined ? it.qtyShipped : it.qtyOrdered);
                            const itemTotal = activeQty * it.price;
                            
                            return (
                              <tr key={it.itemId} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                                <td className="py-3">
                                  <span className="font-extrabold text-slate-800 dark:text-slate-200 block">{it.name}</span>
                                  <span className="text-[9px] text-slate-400">ID: {it.itemId}</span>
                                </td>
                                <td className="py-3 text-right font-mono text-slate-500 dark:text-slate-350">
                                  {formatIDR(it.price)}
                                </td>
                                <td className="py-3 text-center font-bold">
                                  {it.qtyOrdered} <span className="text-[10px] text-slate-400 font-normal">{it.unit}</span>
                                </td>
                                <td className="py-3 text-center font-bold text-orange-600 dark:text-orange-400">
                                  {it.qtyShipped !== undefined ? it.qtyShipped : '-'} <span className="text-[10px] text-slate-400 font-normal">{it.unit}</span>
                                </td>
                                <td className="py-3 text-center font-bold text-indigo-500 dark:text-indigo-400">
                                  {it.qtyReceived > 0 ? it.qtyReceived : '-'} <span className="text-[10px] text-slate-400 font-normal">{it.unit}</span>
                                </td>
                                <td className="py-3 text-right font-mono font-black text-slate-800 dark:text-slate-100 font-mono">
                                  {formatIDR(itemTotal)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Estimasi Nilai Belanja Riil:</span>
                        <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                          {formatIDR(actualCost(selectedOrder))}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 text-right">
                        Metode perhitungan: <b className="text-slate-505 dark:text-slate-350 px-1 bg-white dark:bg-slate-900 border border-slate-150 rounded">Kuantitas Riil x Harga ATK</b>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT SUB-COLUMN: DETAILED WORKFLOW LOGS TIMELINE (takes 2/5 cols) */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-slate-150 dark:border-slate-800">
                      <History className="w-4 h-4 text-indigo-500 animate-spin" style={{ animationDuration: '6s' }} />
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Langkah Pelacakan & Penagihan (Proses Log)</span>
                    </div>

                    <div className="relative pl-5 border-l-2 border-slate-150 dark:border-slate-800 space-y-6 ml-2.5">
                    
                    {/* STEP 1: DRAFT & AJUKAN */}
                    <div className="relative">
                      {/* Timeline Node */}
                      <span className={`absolute -left-[27px] top-1 flex items-center justify-center w-3.5 h-3.5 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                        selectedOrder.status !== 'Draft' 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-indigo-600 text-white animate-pulse'
                      }`}>
                        <span className="text-[8px] font-black">1</span>
                      </span>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-slate-755 dark:text-slate-200">1. Draft & Penghentian Pengajuan</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            selectedOrder.status !== 'Draft'
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                              : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                          }`}>
                            {selectedOrder.status !== 'Draft' ? 'Selesai ✓' : 'Aktif'}
                          </span>
                        </div>

                        {selectedOrder.status === 'Draft' ? (
                          <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                            <p className="text-[10.5px] text-slate-500 leading-relaxed">
                              Pemesanan ATK masih berupa draf lokal di site RS Anda. Ajukan sekarang ke Logistik Kantor Pusat untuk segera diproses stok & pengirimannya.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleAjukanOrder(selectedOrder)}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-2 rounded-lg cursor-pointer transition-colors uppercase tracking-wider block"
                            >
                              Ajukan Sekarang 🚀
                            </button>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/40 rounded-xl text-[10.5px] text-slate-500 space-y-1">
                            <p>📝 <b>Pengaju Site:</b> {selectedOrder.createdBy || 'Site Staff'}</p>
                            <p>🗓️ <b>Tgl Diajukan:</b> {selectedOrder.orderDate || '-'}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* STEP 2: HQ SCM SHIPPING */}
                    <div className="relative">
                      {/* Timeline Node */}
                      <span className={`absolute -left-[27px] top-1 flex items-center justify-center w-3.5 h-3.5 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                        selectedOrder.status === 'Draft'
                          ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                          : selectedOrder.status !== 'Diajukan'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-orange-500 text-white animate-pulse'
                      }`}>
                        <span className="text-[8px] font-black">2</span>
                      </span>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-slate-755 dark:text-slate-200">2. Verifikasi & Pengiriman (Pusat SCM)</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            selectedOrder.status === 'Draft'
                              ? 'bg-slate-100 text-slate-400 dark:bg-slate-800/40'
                              : selectedOrder.status !== 'Diajukan'
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                                : 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-405'
                          }`}>
                            {selectedOrder.status === 'Draft' ? 'Terkunci' : selectedOrder.status !== 'Diajukan' ? 'Selesai ✓' : 'Menunggu Aksi'}
                          </span>
                        </div>

                        {selectedOrder.status === 'Draft' ? (
                          <p className="text-[10px] text-slate-400 italic pl-1">Menunggu pemesanan diajukan dari draf site terlebih dahulu.</p>
                        ) : selectedOrder.status === 'Diajukan' ? (
                          <div className="p-3 bg-orange-50/40 dark:bg-orange-950/10 border border-orange-200/50 dark:border-orange-900/30 rounded-xl space-y-3">
                            {!isHQ ? (
                              <p className="text-[10.5px] text-slate-550 italic leading-relaxed">
                                ⏳ Pengajuan sedang diproses oleh Tim Logistik Kantor Pusat. Stok Anda di Gudang SCM akan diverifikasi sebelum pengiriman dikonfirmasi.
                              </p>
                            ) : (() => {
                              // Stock satisfaction validation calculation
                              const isStockSatisfied = selectedOrder.items.every(it => {
                                const matchedItem = items.find(catIt => catIt.id === it.itemId);
                                const currentStock = matchedItem ? (matchedItem.stockQty !== undefined ? matchedItem.stockQty : 0) : 0;
                                const qtyToShip = shipQtys[it.itemId] !== undefined ? shipQtys[it.itemId] : it.qtyOrdered;
                                return currentStock >= qtyToShip;
                              });

                              return (
                                <div className="space-y-2.5">
                                  <p className="text-[10.5px] text-slate-505 leading-relaxed">
                                    Pusat dapat menyesuaikan jumlah riil pengiriman sesuai kondisi stok Gudang SCM terkini:
                                  </p>

                                  <div className="space-y-2 bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-150 dark:border-slate-800">
                                    {selectedOrder.items.map(it => {
                                      const matchedItem = items.find(catIt => catIt.id === it.itemId);
                                      const currentStock = matchedItem ? (matchedItem.stockQty !== undefined ? matchedItem.stockQty : 0) : 0;
                                      const qtyToShip = shipQtys[it.itemId] !== undefined ? shipQtys[it.itemId] : it.qtyOrdered;
                                      const sufficient = currentStock >= qtyToShip;

                                      return (
                                        <div key={it.itemId} className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-850/60 bg-slate-50/50 dark:bg-slate-950/20 text-xs space-y-1.5">
                                          <div className="flex justify-between font-bold text-slate-755 dark:text-slate-300">
                                            <span className="truncate">{it.name}</span>
                                            <span className="text-slate-400 shrink-0">Req: {it.qtyOrdered} {it.unit}</span>
                                          </div>
                                          <div className="flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-850 pt-1.5 text-[11px]">
                                            <div className="flex items-center gap-1 text-slate-500">
                                              <span>Stok SCM:</span>
                                              <span className={`font-mono font-bold px-1 py-0.2 rounded ${sufficient ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' : 'text-red-500 bg-red-50 dark:bg-red-950/20'}`}>
                                                {currentStock} {it.unit}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                              <span className="text-[10px] text-slate-400">Kirim:</span>
                                              <input
                                                type="number"
                                                min="0"
                                                max={currentStock}
                                                value={qtyToShip}
                                                onChange={(e) => setShipQtys({ ...shipQtys, [it.itemId]: parseInt(e.target.value) || 0 })}
                                                className="w-12 text-center bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded py-0.5 px-1 font-bold text-[10.5px] text-slate-800 dark:text-white focus:outline-none"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  <div>
                                    <label className="block text-[9px] font-extrabold uppercase text-slate-400 mb-1">Catatan Ekspedisi & Pengiriman</label>
                                    <textarea
                                      value={shipNotes}
                                      onChange={(e) => setShipNotes(e.target.value)}
                                      placeholder="e.g. Diantarkan via driver internal, estimasi tiba sore nanti."
                                      className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950 focus:outline-none"
                                      rows={2}
                                    />
                                  </div>

                                  {!isStockSatisfied && (
                                    <div className="p-2.5 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/40 rounded-xl text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                                      ⚠️ <b>Stok Gudang Kurang:</b> Beberapa barang tidak mencukupi untuk dikirim sesuai kuantitas target. Silakan tambah stok kartu stok dahulu atau perkecil jumlah kirim.
                                    </div>
                                  )}

                                  <button
                                    type="button"
                                    disabled={!isStockSatisfied}
                                    onClick={handleKonfirmasiPengiriman}
                                    className={`w-full text-white text-xs font-black py-2 rounded-lg transition-colors uppercase tracking-wider ${
                                      isStockSatisfied 
                                        ? "bg-orange-600 hover:bg-orange-550 cursor-pointer" 
                                        : "bg-slate-350 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed"
                                    }`}
                                  >
                                    Konfirmasi Kirim Barang 🚀
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="p-2.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/40 rounded-xl text-[10.5px] text-slate-500 space-y-1">
                            <p>🗓️ <b>Tgl Kirim:</b> {selectedOrder.shippedDate}</p>
                            <p>📦 <b>PIC Pengirim:</b> {selectedOrder.shippedBy}</p>
                            {selectedOrder.deliveryNotes && <p className="italic text-slate-400">" {selectedOrder.deliveryNotes} "</p>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* STEP 3: SITE VERIFY AND RECEIVE GOODS */}
                    <div className="relative">
                      {/* Timeline Node */}
                      <span className={`absolute -left-[27px] top-1 flex items-center justify-center w-3.5 h-3.5 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                        selectedOrder.status === 'Draft' || selectedOrder.status === 'Diajukan'
                          ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                          : selectedOrder.status !== 'Dikirim'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-blue-500 text-white animate-pulse'
                      }`}>
                        <span className="text-[8px] font-black">3</span>
                      </span>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-slate-755 dark:text-slate-200">3. Konfirmasi Terima Barang (Site)</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            selectedOrder.status === 'Draft' || selectedOrder.status === 'Diajukan'
                              ? 'bg-slate-100 text-slate-400 dark:bg-slate-800/40'
                              : selectedOrder.status !== 'Dikirim'
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                                : 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-405'
                          }`}>
                            {selectedOrder.status === 'Draft' || selectedOrder.status === 'Diajukan' ? 'Terkunci' : selectedOrder.status !== 'Dikirim' ? 'Selesai ✓' : 'Menunggu Aksi'}
                          </span>
                        </div>

                        {selectedOrder.status === 'Draft' || selectedOrder.status === 'Diajukan' ? (
                          <p className="text-[10px] text-slate-400 italic pl-1">Menunggu barang dikirim dari logistik pusat.</p>
                        ) : selectedOrder.status === 'Dikirim' ? (
                          <div className="p-3 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-200/50 dark:border-blue-900/30 rounded-xl space-y-3">
                            {!(isSiteRestricted && userSite.toLowerCase().trim() === selectedOrder.clientRS.toLowerCase().trim()) ? (
                              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-[10.5px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                                ⚠️ <b>Akses Terbatas Site:</b> Konfirmasi terima barang hanya diperkenankan untuk staf resmi dari site pengaju (<b>{selectedOrder.clientRS}</b>).
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                <p className="text-[10.5px] text-slate-505 font-medium leading-relaxed">
                                  Harap verifikasi fisik box logistik dan masukkan jumlah penerimaan riil di lokasi:
                                </p>

                                <div className="space-y-1.5 bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-150 dark:border-slate-800">
                                  {selectedOrder.items.map(it => {
                                    const valShip = it.qtyShipped !== undefined ? it.qtyShipped : it.qtyOrdered;
                                    return (
                                      <div key={it.itemId} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-850/40 last:border-0">
                                        <span className="truncate max-w-[140px] font-semibold text-slate-705 dark:text-slate-300">{it.name}:</span>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <span className="text-[9px] text-slate-400">(Sent: {valShip})</span>
                                          <input
                                            type="number"
                                            min="0"
                                            value={receivedQtys[it.itemId] !== undefined ? receivedQtys[it.itemId] : valShip}
                                            onChange={(e) => setReceivedQtys({ ...receivedQtys, [it.itemId]: parseInt(e.target.value) || 0 })}
                                            className="w-12 text-center bg-slate-50 border border-slate-205 rounded py-0.5 text-[10.5px] font-bold"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                <textarea
                                  value={receiptNotes}
                                  onChange={(e) => setReceiptNotes(e.target.value)}
                                  placeholder="Catatan verifikasi kondisi paket barang..."
                                  className="w-full text-xs p-1.5 border rounded bg-white"
                                  rows={2}
                                />

                                <button
                                  type="button"
                                  onClick={handleKonfirmasiPenerimaan}
                                  className="w-full bg-blue-600 hover:bg-blue-550 text-white text-xs font-black py-2 rounded-lg cursor-pointer transition-colors uppercase tracking-wider"
                                >
                                  Konfirmasi Terima Barang 📦
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-2.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/40 rounded-xl text-[10.5px] text-slate-500 space-y-1">
                            <p>🗓️ <b>Tgl Diterima:</b> {selectedOrder.receivedDate}</p>
                            <p>💼 <b>Penerima Site:</b> {selectedOrder.receivedBy}</p>
                            {selectedOrder.receiptNotes && <p className="italic text-slate-400">" {selectedOrder.receiptNotes} "</p>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* STEP 4: DELIVER TO HOSPITAL RS SIDE & BUKTI FAKTUR SEMENTARA */}
                    <div className="relative">
                      {/* Timeline Node */}
                      <span className={`absolute -left-[27px] top-1 flex items-center justify-center w-3.5 h-3.5 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                        ['Draft', 'Diajukan', 'Dikirim'].includes(selectedOrder.status)
                          ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                          : selectedOrder.status !== 'Diterima'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-teal-500 text-white animate-pulse'
                      }`}>
                        <span className="text-[8px] font-black">4</span>
                      </span>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-slate-755 dark:text-slate-200">4. Penyerahan ke Manajemen RS & Faktur Sementara</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            ['Draft', 'Diajukan', 'Dikirim'].includes(selectedOrder.status)
                              ? 'bg-slate-100 text-slate-400 dark:bg-slate-800/40'
                              : selectedOrder.status !== 'Diterima'
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                                : 'bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-405'
                          }`}>
                            {['Draft', 'Diajukan', 'Dikirim'].includes(selectedOrder.status) ? 'Terkunci' : selectedOrder.status !== 'Diterima' ? 'Selesai ✓' : 'Menunggu Aksi'}
                          </span>
                        </div>

                        {['Draft', 'Diajukan', 'Dikirim'].includes(selectedOrder.status) ? (
                          <p className="text-[10px] text-slate-400 italic pl-1">Menunggu penerimaan barang terkonfirmasi oleh site.</p>
                        ) : selectedOrder.status === 'Diterima' ? (
                          <div className="p-3 bg-teal-50/40 dark:bg-teal-950/10 border border-teal-200/50 dark:border-teal-900/30 rounded-xl space-y-3">
                            <p className="text-[10.5px] text-slate-505 leading-relaxed">
                              Input nomor faktur penyerahan logistik ATK kepada perwakilan Management Rumah Sakit:
                            </p>

                            <div className="grid grid-cols-1 gap-2">
                              <div>
                                <label className="block text-[9px] font-extrabold uppercase text-slate-400">Nomor Faktur Sementara</label>
                                <input
                                  type="text"
                                  value={fakturNo}
                                  onChange={(e) => setFakturNo(e.target.value)}
                                  className="w-full text-xs p-1.5 border border-slate-205 rounded bg-white text-slate-800 font-bold focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] font-extrabold uppercase text-slate-400">Tanggal Penyerahan RS</label>
                                <input
                                  type="date"
                                  value={handoverDate}
                                  onChange={(e) => setHandoverDate(e.target.value)}
                                  className="w-full text-xs p-1.5 border border-slate-205 rounded bg-white text-slate-800 font-bold focus:outline-none"
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={handleKonfirmasiPenyerahanRS}
                              className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold py-2 rounded-lg cursor-pointer transition-all shadow-md uppercase tracking-wider"
                            >
                              Konfirmasi Penyerahan RS & Cetak 🖨️
                            </button>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/40 rounded-xl text-[10.5px] text-slate-500 space-y-1">
                            <p>📄 <b>No. Faktur Sementara:</b> {selectedOrder.fakturSementaraNo}</p>
                            <p>🗓️ <b>Tgl Penyerahan:</b> {selectedOrder.deliveredToRSDate}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* STEP 5: SINKRONISASI TAGIHAN DAN KONEKSI BILLING ATK */}
                    <div className="relative">
                      {/* Timeline Node */}
                      <span className={`absolute -left-[27px] top-1 flex items-center justify-center w-3.5 h-3.5 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                        ['Draft', 'Diajukan', 'Dikirim', 'Diterima'].includes(selectedOrder.status)
                          ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                          : selectedOrder.status !== 'Diserahkan'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-emerald-500 text-white animate-pulse'
                      }`}>
                        <span className="text-[8px] font-black">5</span>
                      </span>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-slate-755 dark:text-slate-200">5. Koneksi Tagihan Billing KSO & ATK</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            ['Draft', 'Diajukan', 'Dikirim', 'Diterima'].includes(selectedOrder.status)
                              ? 'bg-slate-100 text-slate-400 dark:bg-slate-800/40'
                              : selectedOrder.status !== 'Diserahkan'
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450'
                          }`}>
                            {['Draft', 'Diajukan', 'Dikirim', 'Diterima'].includes(selectedOrder.status) ? 'Terkunci' : selectedOrder.status !== 'Diserahkan' ? 'Selesai ✓' : 'Menunggu Koneksi'}
                          </span>
                        </div>

                        {['Draft', 'Diajukan', 'Dikirim', 'Diterima'].includes(selectedOrder.status) ? (
                          <p className="text-[10px] text-slate-400 italic pl-1">Menunggu faktur tanda terima diserahterimakan ke Manajemen RS.</p>
                        ) : selectedOrder.status === 'Diserahkan' || isLinkingBilling ? (
                          <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-205 dark:border-emerald-900/30 rounded-xl space-y-3">
                            <div className="bg-white dark:bg-slate-900 p-2 hover:shadow border rounded text-[10.5px] text-slate-600 space-y-0.5">
                              <p>📄 <b>Nomor Tanda Terima:</b> {selectedOrder.fakturSementaraNo}</p>
                              <p>🗓️ <b>Tgl Serah RS:</b> {selectedOrder.deliveredToRSDate}</p>
                              <p>💰 <b>Nilai Bruto:</b> <b className="text-slate-800 font-mono">{formatIDR(actualCost(selectedOrder))}</b></p>
                            </div>

                            <div className="space-y-2.5">
                              {/* Months Dropdown Inputs (as requested in Point 4) */}
                              <div>
                                <label className="block text-[9px] font-extrabold uppercase text-slate-400 mb-1">Bulan Penerimaan</label>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="text-xs p-1.5 border border-slate-205 dark:border-slate-800 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  >
                                    {monthsOpt.map(m => (
                                      <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                  </select>
                                  <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="text-xs p-1.5 border border-slate-205 dark:border-slate-800 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  >
                                    {yearsOpt.map(y => (
                                      <option key={y} value={y}>{y}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[9px] font-extrabold uppercase text-slate-400 mb-1">PPN (%)</label>
                                <input
                                  type="number"
                                  value={billingPpnPercent}
                                  onChange={(e) => setBillingPpnPercent(parseFloat(e.target.value) || 0)}
                                  className="w-full text-xs p-1.5 border border-slate-205 dark:border-slate-800 rounded bg-white dark:bg-slate-950 text-slate-850 font-bold focus:outline-none"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={handleKoneksikanBilling}
                                className="w-full bg-emerald-600 hover:bg-emerald-550 text-white text-xs font-extrabold py-2 rounded-lg cursor-pointer transition-all shadow-md uppercase tracking-wider flex items-center justify-center gap-1"
                              >
                                🚀 Hubungkan Ke Billing Sekarang
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/40 rounded-xl text-[10.5px] text-slate-500 space-y-1.5 text-center">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                            <p className="font-extrabold text-xs text-slate-800 dark:text-slate-100 italic uppercase">Tagihan ATK Terkoneksi</p>
                            <p className="text-[10.5px]">Sukses dihubungkan dengan ID Billing Referensi: <b>#{selectedOrder.billingKsoId}</b></p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

          </div>

        </div>
      )}

      {/* VIEW: REKAP TIMAL AND VENDOR PROCUREMENT */}
      {!loading && activeTab === 'rekap' && (
        <div className="space-y-6">
          
          {/* HEADER REKAP */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="bg-indigo-50 dark:bg-slate-850 text-indigo-700 dark:text-indigo-400 text-[10px] font-black border border-indigo-200/50 dark:border-slate-800 px-3 py-1 rounded-md uppercase tracking-wider block w-fit mb-1.5">
                  Konsolidasi Rantai Pasok ATK
                </span>
                <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-indigo-650" />
                  Rekapitulasi Pemesanan & Pengadaan Vendor
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Rangkum draf site menjadi rekapan kolektif, dan pantau kedatangan pengiriman dari vendor ke Gudang Pusat SCM secara real-time per data pemesanan.
                </p>
              </div>

              {/* Status indicators */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-205 dark:border-slate-800 flex items-center gap-4 text-xs font-bold text-slate-655 dark:text-slate-300">
                <div>
                  <span className="text-[10px] block text-slate-400 uppercase font-extrabold">Batch Terbuat:</span>
                  <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400">
                    {Array.from(new Set(orders.map(o => o.rekapId).filter(Boolean))).length} Batch
                  </span>
                </div>
                <div className="border-l h-8 border-slate-200 dark:border-slate-800" />
                <div>
                  <span className="text-[10px] block text-slate-400 uppercase font-extrabold">Belum Direkap:</span>
                  <span className="font-mono text-sm font-black text-amber-500">
                    {orders.filter(o => o.status === 'Diajukan' && !o.rekapId).length} Order
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in-down">
            
            {/* LEFT CONTAINER: ACTIVE & HISTORIC REKAPAN */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* SUBSECTION 1: BLOK ESTIMASI KEBUTUHAN KOLEKTIF BARU (BELUM DI-REKAP) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-indigo-600" />
                    1. Antrean Kebutuhan Belanja Kolektif Baru (Belum Dipesan)
                  </h4>
                  <span className="text-[9px] text-amber-600 bg-amber-50 dark:bg-amber-950/40 font-black px-2 py-0.5 rounded uppercase font-bold">
                    Pemesanan Selanjutnya
                  </span>
                </div>

                {(orders.filter(o => o.status === 'Diajukan' && !o.rekapId).length === 0 && vLogisticsCustomItems.length === 0) ? (
                  <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-xl p-6 text-center text-slate-400 space-y-1 border border-dashed border-slate-200 dark:border-slate-800">
                    <Package className="w-8 h-8 text-slate-350 mx-auto opacity-75" />
                    <p className="text-[11px] font-extrabold uppercase text-slate-455 tracking-wider">Antrean Kolektif Kosong</p>
                    <p className="text-[10px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Belum ada pemesanan site yang berstatus 'Diajukan' yang belum direkap. Apabila site mengirimkan pengajuan baru, otomatis akan masuk ke antrean belanja ini. Anda juga bisa menambahkan item katalog manual untuk penyediaan stok logistik di bawah ini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3 border-slate-100 dark:border-slate-800">
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                        Kumulatif kuantitas ATK yang diajukan oleh site ditambah persediaan stok penyangga yang dipesan SCM Logistik Pusat:
                      </p>
                      
                      {/* PRINT BATCH BUTTON IN SECTION 1 */}
                      <button
                        type="button"
                        onClick={() => setPrintRekapBatchId("DRAFT")}
                        className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-indigo-400 dark:hover:bg-slate-705 px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer/ transition-all shadow-xs shrink-0 self-end sm:self-auto"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Cetak Rekap Barang (Draf)</span>
                      </button>
                    </div>

                    <div className="border border-slate-150 dark:border-slate-850 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-950 text-slate-450 font-black text-[10px] tracking-wider uppercase border-b border-slate-250 dark:border-slate-850">
                            <th className="p-2.5 pl-4">No.</th>
                            <th className="p-2.5">Nama ATK / Deskripsi Barang</th>
                            <th className="p-2.5 text-center">Unit</th>
                            <th className="p-2.5 text-center">Kebutuhan Site</th>
                            <th className="p-2.5 text-center bg-amber-50/50 dark:bg-amber-955/20 text-text-amber-700 dark:text-amber-400 font-black">Pesan Tambahan (Stok SCM)</th>
                            <th className="p-2.5 text-center bg-indigo-50/30">Total Vendor Qty</th>
                            <th className="p-2.5 text-right">Harga Satuan</th>
                            <th className="p-2.5 text-right pr-4">Total Nilai</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-805/40 font-medium text-slate-800 dark:text-slate-200">
                          {(() => {
                            const pendingOrders = orders.filter(o => o.status === 'Diajukan' && !o.rekapId);
                            const consolidatedItems: Record<string, { itemId: string; name: string; unit: string; price: number; qtyNeeded: number }> = {};
                            
                            // 1. Add items requested by sites
                            pendingOrders.forEach(order => {
                              order.items.forEach(it => {
                                if (!consolidatedItems[it.itemId]) {
                                  consolidatedItems[it.itemId] = {
                                    itemId: it.itemId,
                                    name: it.name,
                                    unit: it.unit,
                                    price: it.price,
                                    qtyNeeded: 0
                                  };
                                }
                                consolidatedItems[it.itemId].qtyNeeded += it.qtyOrdered;
                              });
                            });

                            // 2. Add custom items manually selected by logistics
                            vLogisticsCustomItems.forEach(itemId => {
                              if (!consolidatedItems[itemId]) {
                                const matchedCatalogItem = items.find(i => i.id === itemId);
                                if (matchedCatalogItem) {
                                  consolidatedItems[itemId] = {
                                    itemId: itemId,
                                    name: matchedCatalogItem.name,
                                    unit: matchedCatalogItem.unit,
                                    price: matchedCatalogItem.priceToday || matchedCatalogItem.price,
                                    qtyNeeded: 0
                                  };
                                }
                              }
                            });

                            const list = Object.values(consolidatedItems);
                            
                            return list.map((it, idx) => {
                              const extraStock = extraStockQuantities[it.itemId] ?? 0;
                              const totalVendorQty = it.qtyNeeded + extraStock;
                              const rowTotalPrice = totalVendorQty * it.price;

                              return (
                                <tr key={it.itemId} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                                  <td className="p-2.5 pl-4 font-mono font-bold text-slate-400">{idx + 1}</td>
                                  <td className="p-2.5 font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                                    <span>{it.name}</span>
                                    {it.qtyNeeded === 0 && (
                                      <span className="px-1.5 py-0.5 rounded text-[8.5px] bg-amber-100 text-amber-850 dark:bg-amber-955 dark:text-amber-300 font-bold uppercase">
                                        Murni Stok SCM
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2.5 text-center">
                                    <span className="bg-slate-105 border border-slate-200 text-slate-655 text-[10px] font-black px-1.5 py-0.5 rounded uppercase dark:bg-slate-800 dark:border-slate-700 dark:text-slate-305">
                                      {it.unit}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-center font-bold text-slate-600 dark:text-slate-400">{it.qtyNeeded} {it.unit}</td>
                                  <td className="p-2.5 text-center bg-amber-50/10 dark:bg-amber-955/5">
                                    <input
                                      type="number"
                                      min="0"
                                      value={extraStock === 0 ? "" : extraStock}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value) || 0;
                                        setExtraStockQuantities(prev => ({
                                          ...prev,
                                          [it.itemId]: val >= 0 ? val : 0
                                        }));
                                      }}
                                      placeholder="0"
                                      className="w-16 text-center text-xs p-1 border border-slate-205 dark:border-slate-800 rounded bg-white dark:bg-slate-950 font-bold text-amber-600 dark:text-amber-400 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                    />
                                  </td>
                                  <td className="p-2.5 text-center font-black text-indigo-650 bg-indigo-50/20 dark:text-indigo-400 dark:bg-indigo-950/20 font-mono text-xs">
                                    {totalVendorQty} {it.unit}
                                  </td>
                                  <td className="p-2.5 text-right font-mono text-slate-500 dark:text-slate-400">{formatIDR(it.price)}</td>
                                  <td className="p-2.5 text-right font-mono font-black text-slate-800 dark:text-slate-100 pr-4">{formatIDR(rowTotalPrice)}</td>
                                </tr>
                              );
                            });
                          })()}
                          <tr className="bg-indigo-50/10 dark:bg-indigo-955/5 font-bold border-t border-slate-250 dark:border-slate-800 text-slate-950 dark:text-slate-100">
                            <td colSpan={7} className="p-2.5 text-right text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-extrabold">ESTIMASI TOTAL BELANJA VENDOR (SITE + STOK SCM):</td>
                            <td className="p-2.5 text-right font-mono font-black text-indigo-750 dark:text-indigo-400 pr-4 text-xs">
                              {(() => {
                                const pendingOrders = orders.filter(o => o.status === 'Diajukan' && !o.rekapId);
                                let siteSum = pendingOrders.reduce((sum, ord) => {
                                  return sum + ord.items.reduce((itemSum, it) => itemSum + (it.qtyOrdered * it.price), 0);
                                }, 0);
                                let extraSum = Object.entries(extraStockQuantities).reduce((sum, [itemId, qty]) => {
                                  const itemInfo = items.find(i => i.id === itemId);
                                  const price = itemInfo?.priceToday || itemInfo?.price || 0;
                                  return sum + ((qty as number) * price);
                                }, 0);
                                return formatIDR(siteSum + extraSum);
                              })()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* DIRECT STOCK SELECTION DROPDOWN */}
                    <div className="flex flex-col sm:flex-row items-end gap-2.5 bg-slate-50 dark:bg-slate-950/40 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <div className="flex-1 w-full text-left">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Pilih Item untuk Ditambahkan ke Stok (Optional):</label>
                        <select
                          value={selectedItemForStock}
                          onChange={(e) => setSelectedItemForStock(e.target.value)}
                          className="w-full text-xs p-2 border border-slate-205 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-150 font-extrabold focus:outline-none"
                        >
                          <option value="">-- Sertakan Item Lain dari Katalog --</option>
                          {items
                            .map(item => (
                              <option key={item.id} value={item.id}>
                                {item.name} ({item.unit}) - {formatIDR(item.priceToday || item.price)} [Stok Gudang: {item.stockQty ?? 0}]
                              </option>
                            ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedItemForStock) return;
                          if (!vLogisticsCustomItems.includes(selectedItemForStock)) {
                            setVLogisticsCustomItems([...vLogisticsCustomItems, selectedItemForStock]);
                          }
                          setSelectedItemForStock("");
                        }}
                        disabled={!selectedItemForStock}
                        className="bg-indigo-600 hover:bg-indigo-750 disabled:opacity-50 text-white text-xs font-black px-4 py-2.5 rounded-xl h-fit cursor-pointer flex items-center gap-1 transition-all shadow-xs shrink-0 self-end sm:self-auto w-full sm:w-auto justify-center"
                      >
                        <span>➕ Tambah Item Stok</span>
                      </button>
                    </div>

                    {/* Site Orders involved in this queue */}
                    {orders.filter(o => o.status === 'Diajukan' && !o.rekapId).length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Site Pemesan Terlibat:</span>
                        <div className="flex flex-wrap gap-2">
                          {orders.filter(o => o.status === 'Diajukan' && !o.rekapId).map(o => (
                            <span key={o.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg text-[10.5px] font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <b>{o.clientRS}</b> &nbsp;({o.items.length} item) &nbsp;<span className="text-slate-400 font-normal font-mono text-[9px]">[{o.noPemesanan}]</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SUBSECTION 2: DAFTAR HISTORIS BATCH REKAPAN PER PEMESANAN */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-650" />
                    2. Riwayat Rekapan per Pemesanan (Pemesanan Kolektif yang Diproses)
                  </h4>
                  <span className="text-[10px] font-mono text-slate-450 uppercase font-bold">SCM Sourcing Batches</span>
                </div>

                {(() => {
                  const rekapIds = Array.from(new Set(orders.map(o => o.rekapId).filter(Boolean))) as string[];
                  const sortedRekapGroupIds = [...rekapIds].sort((a, b) => {
                    const matchA = a.match(/RKP-(\d+)/);
                    const matchB = b.match(/RKP-(\d+)/);
                    if (matchA && matchB) {
                      return parseInt(matchB[1]) - parseInt(matchA[1]); // Descending values
                    }
                    return b.localeCompare(a);
                  });

                  if (sortedRekapGroupIds.length === 0) {
                    return (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-slate-400">
                        <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2 opacity-80" />
                        <p className="text-[11px] font-bold uppercase tracking-wider">Belum Ada Histori Rekapan Vendor</p>
                        <p className="text-[10px] text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                          Halaman riwayat akan aktif setelah SCM Kantor Pusat mendaftarkan pengadaan vendor pertama dari tab form registrasi di sebelah kanan.
                        </p>
                      </div>
                    );
                  }

                  return sortedRekapGroupIds.map(rkId => {
                    const matchedOrders = orders.filter(o => o.rekapId === rkId);
                    const sampleOrd = matchedOrders[0] || {};
                    const totalCost = matchedOrders.reduce((sum, o) => sum + o.items.reduce((iSum, i) => iSum + (i.price * i.qtyOrdered), 0), 0);
                    const isAllArrived = matchedOrders.every(o => o.vendorStatus === "Barang Masuk Gudang Pusat");

                    return (
                      <div key={rkId} className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl overflow-hidden p-5 shadow-sm space-y-4 animate-fade-in-down border-l-4 border-l-indigo-600">
                        
                        {/* Rekap Header summary */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-805/70 pb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="bg-indigo-600 text-white font-mono text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                                {rkId}
                              </span>
                              <span className="text-xs font-black uppercase tracking-wide text-slate-805 dark:text-slate-150">
                                Vendor: {sampleOrd.vendorName || "Tidak Dikenal"}
                              </span>
                              {isAllArrived ? (
                                <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase font-bold">
                                  SUKSES GUDANG UTAMA SCM
                                </span>
                              ) : (
                                <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase animate-pulse font-bold">
                                  DALAM INDEN VENDOR
                                </span>
                              )}
                            </div>
                            {sampleOrd.vendorNotes && (
                              <p className="text-[10.5px] text-slate-500 italic">
                                &ldquo; {sampleOrd.vendorNotes} &rdquo;
                              </p>
                            )}
                          </div>
                          
                          <div className="text-right text-xs flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPrintRekapBatchId(rkId)}
                              className="bg-indigo-55 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-400 text-[10px] font-black px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all border border-indigo-200/50 dark:border-slate-750"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Cetak Rekap Barang</span>
                            </button>
                            <div className="text-right">
                              <span className="text-[9px] block text-slate-400 uppercase font-extrabold leading-none mb-0.5">Akumulasi Nilai:</span>
                              <span className="font-mono font-black text-indigo-700 dark:text-indigo-400 text-sm block leading-none">
                                {formatIDR(totalCost)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* List of orders included in this rekapId */}
                        <div className="space-y-3 pt-1">
                          <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider block font-extrabold">
                            Daftar Pemesanan RS & Status Kedatangan (Terpisah per RS):
                          </span>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {matchedOrders.map(ord => {
                              const ordCost = ord.items.reduce((s, i) => s + (i.price * i.qtyOrdered), 0);
                              const isArrived = ord.vendorStatus === "Barang Masuk Gudang Pusat";

                              return (
                                <div key={ord.id} className={`border rounded-xl p-4 transition-all space-y-3.5 flex flex-col justify-between ${isArrived ? 'border-emerald-200 bg-emerald-50/5 dark:border-emerald-900/40' : 'border-slate-205 dark:border-slate-800 bg-slate-50/20'}`}>
                                  <div className="space-y-2">
                                    <div className="flex justify-between gap-2 items-start">
                                      <div>
                                        <span className="text-[9px] font-mono text-slate-40block p-0">REF: {ord.noPemesanan}</span>
                                        <h5 className="text-[11.5px] font-black text-slate-800 dark:text-slate-100 uppercase leading-none mt-1">
                                          {ord.clientRS}
                                        </h5>
                                      </div>
                                      <span className={`text-[8.5px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${isArrived ? 'bg-emerald-50 text-emerald-600 border-emerald-205 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 border-amber-205 dark:bg-amber-950 dark:text-amber-400'}`}>
                                        {isArrived ? "MASUK STOK" : "INDEN VENDOR"}
                                      </span>
                                    </div>

                                    <ul className="text-[10.5px] text-slate-655 dark:text-slate-400 space-y-1 bg-white dark:bg-slate-900/50 p-2 border border-slate-105 rounded-lg">
                                      {ord.items.map((i, idX) => (
                                        <li key={idX} className="flex justify-between font-bold">
                                          <span className="text-slate-700">• {i.name}</span>
                                          <span className="font-mono font-black text-indigo-700">
                                            {i.qtyOrdered} {i.unit}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-[10px]">
                                      <span className="text-slate-400 font-bold">Total Nilai: <strong className="font-mono text-slate-700">{formatIDR(ordCost)}</strong></span>
                                      <span className="text-slate-400 font-bold">Tugas: {ord.createdBy || "Site"}</span>
                                    </div>

                                    {/* DETAILED ACTION BUTTON PER ORDER ARRIVAL TIME */}
                                    {isArrived ? (
                                      <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold p-2 rounded-lg flex items-center justify-between gap-1 border border-emerald-200/30">
                                        <span className="flex items-center gap-1 font-bold">✅ Barang Masuk Stok SCM</span>
                                        <span className="font-mono text-[9px] text-slate-500 font-normal">{ord.vendorArrivedDate || ord.orderDate}</span>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleConfirmOrderArrival(ord)}
                                        className="w-full bg-emerald-600 hover:bg-emerald-750 text-white font-black text-[10.5px] py-1.5 rounded-lg transition-colors cursor-pointer tracking-wider uppercase flex items-center justify-center gap-1 shadow-xs"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Konfirmasi Barang Datang per Order</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    );
                  });
                })()}
              </div>

            </div>
            
            {/* RIGHT CONTAINER: ACTION VENDOR PROCUREMENT WORKSPACE */}
            <div className="space-y-6">
              
              {/* STEP 1 FORM: REGISTER PROCUREMENT */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
                <div className="space-y-0.5 border-b pb-2 border-slate-100 dark:border-slate-800">
                  <span className="text-[9px] text-indigo-655 bg-indigo-50 dark:bg-indigo-950 font-black px-2 py-0.5 rounded tracking-wide uppercase">Pusat SCM Pengadaan</span>
                  <h3 className="text-xs font-black text-slate-850 dark:text-white uppercase mt-1">Buat Summary & Rekap Vendor</h3>
                  <p className="text-[10px] text-slate-400">Bundel semua order site berstatus 'Diajukan' menjadi batch Procurement baru.</p>
                </div>

                {orders.filter(o => o.status === 'Diajukan' && !o.rekapId).length === 0 ? (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-[10px] text-slate-400 italic text-center font-bold">
                    Tidak ada antrean pengajuan baru yang perlu direkap saat ini.
                  </div>
                ) : (
                  <div className="space-y-3 text-left">
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wide mb-1">Nama Pihak Vendor ATK <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={vendorName}
                        onChange={(e) => setVendorName(e.target.value)}
                        placeholder="Contoh: CV. Sinar Mandiri Jaya"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-202 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-400 font-extrabold"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wide mb-1">Catatan / Keterangan Pengadaan Vendor</label>
                      <textarea
                        rows={3}
                        value={vendorOrderNotes}
                        onChange={(e) => setVendorOrderNotes(e.target.value)}
                        placeholder="Contoh: Draf barang telah ditransmisikan, estimasi barang sampai tgl 12."
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-202 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-400 font-medium"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmVendorProcurement}
                      className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-black text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-md uppercase tracking-wide"
                    >
                      Konfirmasi Pengadaan Vendor ✅
                    </button>
                  </div>
                )}
              </div>

              {/* INFORMATION CARDS */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed space-y-2">
                <span className="font-extrabold block text-slate-700 dark:text-slate-300">💡 Alur Rantai Distribusi ATK:</span>
                <p>1. Site koordinator mengajukan draf Kertas & ATK SIMRS (Status: <b>Diajukan</b>).</p>
                <p>2. Logistik Kantor Pusat mengevaluasi dan merangkum dalam menu rekapitulasi kebutuhan kolektif.</p>
                <p>3. Melakukan pemesanan ke Vendor ATK dengan menekan Konfirmasi Pengadaan Vendor.</p>
                <p>4. Barang dikirim Vendor ke gudang pusat. Pusat mendata kedatangan barang <b>per order</b> untuk menambah stok Gudang SCM.</p>
                <p>5. Pusat mendistribusikan ke masing-masing site dengan menekan "Konfirmasi Kirim Barang 🚀" pada detail order (status: <b>Dikirim</b>).</p>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* VIEW: CATALOGUE MASTER CONFIGURATION */}
      {!loading && activeTab === 'master' && (
        <div className="space-y-6">
          
          {/* HEADER MASTER CONTAINER */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] tracking-wider uppercase font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">HQ Logistics Master Suite</span>
                <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-5 h-5 text-indigo-650" />
                  Manajemen Katalog, Harga & Stok SCM
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Atur spesifikasi master barang, sesuaikan fluktuasi periode harga harian, dan luruskan verifikasi lalu lintas audit kartu stok logistik pusat.
                </p>
              </div>

              {/* Stats overview */}
              <div className="flex gap-4 font-bold text-xs text-slate-655 uppercase">
                <div className="bg-slate-50 border p-2.5 rounded-xl text-center">
                  <span className="text-[9px] text-slate-400 block">Total Item Katalog:</span>
                  <span className="font-mono text-xs font-black text-indigo-600">{items.length} Item</span>
                </div>
                <div className="bg-slate-50 border p-2.5 rounded-xl text-center">
                  <span className="text-[9px] text-slate-400 block">Total Kuantitas SCM:</span>
                  <span className="font-mono text-xs font-black text-emerald-600">
                    {items.reduce((sum, i) => sum + (i.stockQty !== undefined ? i.stockQty : 100), 0)} Unit
                  </span>
                </div>
              </div>
            </div>

            {/* MASTER SUB-TABS SELECTOR */}
            <div className="flex border-b border-slate-205 dark:border-slate-800 mt-6 pb-px gap-2">
              <button
                type="button"
                onClick={() => setMasterSubTab('katalog')}
                className={`pb-2.5 px-4 text-[11px] font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  masterSubTab === 'katalog'
                    ? 'border-indigo-655 text-indigo-700 dark:text-indigo-400 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                📖 1. Master Katalog & Satuan
              </button>
              <button
                type="button"
                onClick={() => setMasterSubTab('harga')}
                className={`pb-2.5 px-4 text-[11px] font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  masterSubTab === 'harga'
                    ? 'border-indigo-655 text-indigo-700 dark:text-indigo-400 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                🏷️ 2. Periode Harga Terkini
              </button>
              <button
                type="button"
                onClick={() => setMasterSubTab('stok')}
                className={`pb-2.5 px-4 text-[11px] font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  masterSubTab === 'stok'
                    ? 'border-indigo-655 text-indigo-700 dark:text-indigo-400 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                📇 3. Kartu Stok Barang
              </button>
            </div>
          </div>

          {/* ACTIVE MASTER SUB-TABS VIEWPORTS */}

          {/* SUB-TAB A: KATALOG & SATUAN */}
          {masterSubTab === 'katalog' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Left Column: Catalogue Table */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Identitas & Standarisasi Satuan</h3>
                    <p className="text-[10px] text-slate-400">Pendaftaran merek rujukan dan unit standardisasi kemasan logistik site</p>
                  </div>

                  {!isAddingItem && isHQ && (
                    <button
                      onClick={() => {
                        setIsAddingItem(true);
                        setEditingItemId(null);
                        setItemName("");
                        setItemUnit("Rim");
                        setItemPrice(0);
                      }}
                      className="bg-indigo-55 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Barang</span>
                    </button>
                  )}
                </div>

                <div className="border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 font-black text-slate-450 tracking-wider uppercase border-b border-slate-150 dark:border-slate-800 text-[10px]">
                        <th className="p-3 pl-4">No.</th>
                        <th className="p-3">Nama Barang ATK</th>
                        <th className="p-3">Satuan Unit</th>
                        <th className="p-3 text-right">Harga Baseline (Rujukan)</th>
                        {isHQ && <th className="p-3 pr-4 text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={isHQ ? 5 : 4} className="p-8 text-center text-slate-400 italic">
                            Belum ada data master katalog ATK. Silakan registrasikan barang perdana.
                          </td>
                        </tr>
                      ) : (
                        items.map((it, index) => {
                          const isEditing = editingItemId === it.id;
                          
                          return (
                            <tr key={it.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                              <td className="p-3 pl-4 font-mono font-bold text-slate-400">{index + 1}</td>
                              <td className="p-3">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-202 rounded py-1 px-2 font-bold text-xs"
                                  />
                                ) : (
                                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{it.name}</span>
                                )}
                              </td>
                              <td className="p-3">
                                {isEditing ? (
                                  <select
                                    value={itemUnit}
                                    onChange={(e) => setItemUnit(e.target.value)}
                                    className="bg-white border rounded py-1 px-2 focus:outline-none focus:border-blue-500 text-xs"
                                  >
                                    <option value="Rim">Rim</option>
                                    <option value="Box">Box</option>
                                    <option value="Pcs">Pcs</option>
                                    <option value="Pack">Pack</option>
                                    <option value="Set">Set</option>
                                    <option value="Lusin">Lusin</option>
                                  </select>
                                ) : (
                                  <span className="bg-slate-105 border border-slate-200 text-slate-605 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                                    {it.unit}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-slate-700 dark:text-slate-100">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={itemPrice}
                                    onChange={(e) => setItemPrice(parseInt(e.target.value) || 0)}
                                    className="w-24 bg-white dark:bg-slate-950 border border-slate-150 rounded py-1 px-2 font-mono"
                                  />
                                ) : (
                                  formatIDR(it.price)
                                )}
                              </td>
                              {isHQ && (
                                <td className="p-3 pr-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {isEditing ? (
                                      <>
                                        <button
                                          onClick={(e) => handleUpdateItem(e, it.id)}
                                          className="text-emerald-600 hover:bg-emerald-55 text-[10px] font-extrabold px-2 py-1 rounded border border-emerald-205 cursor-pointer"
                                        >
                                          Simpan
                                        </button>
                                        <button
                                          onClick={() => setEditingItemId(null)}
                                          className="text-slate-500 hover:bg-slate-50 text-[10px] font-extrabold px-2 py-1 rounded border border-slate-205 cursor-pointer"
                                        >
                                          Batal
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => {
                                            setEditingItemId(it.id);
                                            setIsAddingItem(false);
                                            setItemName(it.name);
                                            setItemUnit(it.unit);
                                            setItemPrice(it.price);
                                            setItemStock(it.stockQty !== undefined ? it.stockQty : 100);
                                          }}
                                          className="text-blue-500 hover:bg-blue-55 p-1 rounded cursor-pointer"
                                          title="Edit Barang"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteItem(it.id)}
                                          className="text-red-500 hover:bg-red-55 p-1 rounded cursor-pointer"
                                          title="Hapus Barang"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Dynamic Form to Add Catalogue */}
              <div className="space-y-4">
                {isAddingItem && isHQ ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm relative">
                    <button
                      onClick={() => setIsAddingItem(false)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-605 p-1 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-full cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="space-y-0.5">
                      <span className="text-[10px] tracking-wider uppercase font-extrabold text-blue-605">Form Master</span>
                      <h3 className="text-xs font-black text-slate-805 dark:text-white uppercase">Sertakan Barang Baru</h3>
                    </div>

                    <form onSubmit={handleCreateItem} className="space-y-3 pt-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Nama Barang ATK <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Kertas HVS F4 75gr"
                          value={itemName}
                          onChange={(e) => setItemName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Satuan Resmi</label>
                          <select
                            value={itemUnit}
                            onChange={(e) => setItemUnit(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-400"
                          >
                            <option value="Rim">Rim</option>
                            <option value="Box">Box</option>
                            <option value="Pcs">Pcs</option>
                            <option value="Pack">Pack</option>
                            <option value="Set">Set</option>
                            <option value="Lusin">Lusin</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Harga Satuan Baseline <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            required
                            value={itemPrice}
                            onChange={(e) => setItemPrice(parseInt(e.target.value) || 0)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Stok Awal Gudang Logistik Pusat <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          required
                          value={itemStock}
                          onChange={(e) => setItemStock(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-505 font-mono font-bold"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2 rounded-xl transition-all shadow-md cursor-pointer uppercase tracking-wider"
                      >
                        Simpan Katalog Baru
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-205 space-y-3">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">📖 Standarisasi Master</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                      Gunakan modul ini untuk menjamin konsistensi sirkulasi nama ATK di seluruh Rumah Sakit cabang sehingga tidak timbul duplikasi item saat pemesanan.
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Satu barang master terikat langsung pada rekap vendor dan pelaporan kartu stok logistik pusat.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* SUB-TAB B: PERIODE HARGA TERKINI (TODAY VS TOMORROW) */}
          {masterSubTab === 'harga' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Left Column: Pricing List and Overrides */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Simulasi Fluktuasi Harga Logistik</h3>
                  <p className="text-[10.5px] text-slate-400">Pemisahan penentuan harga khusus harian. Harga ini akan otomatis di-apply saat draf site diajukan.</p>
                </div>

                <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-450 font-black tracking-wider uppercase border-b text-[10px]">
                        <th className="p-3 pl-4">Nama ATK</th>
                        <th className="p-3 text-center">Unit</th>
                        <th className="p-3 text-right">Harga Baseline</th>
                        <th className="p-3 text-right bg-indigo-50/20">Harga Hari Ini (Aktif)</th>
                        <th className="p-3 text-right bg-amber-50/20">Harga Besok (Antrean)</th>
                        <th className="p-3 pr-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {items.map(it => {
                        const hasToday = it.priceToday !== undefined && it.priceToday > 0;
                        const hasTomorrow = it.priceTomorrow !== undefined && it.priceTomorrow > 0;
                        const isThisSelected = selectedPriceEditItemId === it.id;

                        return (
                          <tr key={it.id} className={`hover:bg-slate-50/50 ${isThisSelected ? 'bg-indigo-50/20' : ''}`}>
                            <td className="p-3 font-extrabold text-slate-800">{it.name}</td>
                            <td className="p-3 text-center">
                              <span className="bg-slate-105 border border-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded uppercase font-black">
                                {it.unit}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono text-slate-400">{formatIDR(it.price)}</td>
                            <td className="p-3 text-right font-mono font-black text-indigo-750 bg-indigo-50/10">
                              {hasToday ? (
                                <span className="flex flex-col items-end">
                                  <span>{formatIDR(it.priceToday)}</span>
                                  <span className="text-[8px] text-emerald-600 bg-emerald-50 px-1 rounded uppercase tracking-wide">Custom</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">{formatIDR(it.price)} (Base)</span>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono font-black text-amber-705 bg-amber-50/10">
                              {hasTomorrow ? (
                                <span className="flex flex-col items-end">
                                  <span>{formatIDR(it.priceTomorrow)}</span>
                                  <span className="text-[8px] text-amber-600 bg-amber-100 px-1 rounded uppercase tracking-wide">Antrean</span>
                                </span>
                              ) : (
                                <span className="text-slate-300 font-normal">- (Sama)</span>
                              )}
                            </td>
                            <td className="p-3 pr-4 text-center">
                              <button
                                onClick={() => {
                                  setSelectedPriceEditItemId(it.id);
                                  setEditPriceToday(it.priceToday || it.price);
                                  setEditPriceTomorrow(it.priceTomorrow || it.price);
                                }}
                                className="bg-slate-100 hover:bg-indigo-650 hover:text-white text-slate-700 text-[10.5px] font-black px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                              >
                                Atur Harga 🏷️
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Pricing Adjustor Form */}
              <div className="space-y-4">
                {selectedPriceEditItemId ? (() => {
                  const target = items.find(it => it.id === selectedPriceEditItemId);
                  if (!target) return null;

                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm relative">
                      <button
                        onClick={() => setSelectedPriceEditItemId(null)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="space-y-0.5">
                        <span className="text-[9px] tracking-wider uppercase font-extrabold text-indigo-605">Adjustment Periode</span>
                        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase">Set Harian: {target.name}</h3>
                        <p className="text-[10px] text-slate-400">Sesuaikan rate nego vendor terkini demi akurasi purchase bill</p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                            Harga Hari Ini (Berlaku Sekarang)
                          </label>
                          <input
                            type="number"
                            value={editPriceToday}
                            onChange={(e) => setEditPriceToday(parseInt(e.target.value) || 0)}
                            className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs font-mono font-black text-slate-800 text-left"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                            Harga Besok (Estimasi Antrean)
                          </label>
                          <input
                            type="number"
                            value={editPriceTomorrow}
                            onChange={(e) => setEditPriceTomorrow(parseInt(e.target.value) || 0)}
                            className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs font-mono font-black text-amber-705 text-left"
                          />
                        </div>

                        <div className="flex gap-2 pt-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdatePrice(target.id, editPriceToday, editPriceTomorrow);
                              setSelectedPriceEditItemId(null);
                            }}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2 rounded-lg transition-all shadow-sm cursor-pointer"
                          >
                            Update Periode Harga Terkini
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-205 text-center text-slate-400 space-y-2">
                    <Info className="w-8 h-8 text-indigo-400 mx-auto" />
                    <p className="text-[11px] font-extrabold uppercase text-slate-655">Menu Atur Harga Harian</p>
                    <p className="text-[10.5px] leading-relaxed">
                      Silakan klik tombol <b>&ldquo;Atur Harga&rdquo;</b> pada tabel di samping kiri untuk mengonfigurasi fluktuasi rate harian untuk hari ini dan besok.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* SUB-TAB C: KARTU STOK BARANG */}
          {masterSubTab === 'stok' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Left Column: Select Item to Audit Stock */}
              <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Verifikasi Stok Fisik SCM</h3>
                  <p className="text-[10px] text-slate-400">Pilih salah satu standardisasi logistik di bawah untuk melacak mutasi masuk/keluar.</p>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {items.map(it => {
                    const isSelected = selectedStockCardItemId === it.id;
                    const stock = it.stockQty !== undefined ? it.stockQty : 100;
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => setSelectedStockCardItemId(it.id)}
                        className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex justify-between items-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/40'
                            : 'border-slate-150 bg-slate-50/20 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <span className="font-extrabold text-slate-805 block text-[11px]">{it.name}</span>
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold">Satuan: {it.unit}</span>
                        </div>
                        <span className={`font-mono font-black text-xs px-2 py-0.5 rounded border ${stock <= 20 ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-750 border-emerald-200'}`}>
                          {stock} {it.unit}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Middle & Right Column: Interactive Stock Card ledger timeline */}
              <div className="lg:col-span-2 space-y-4">
                {selectedStockCardItemId ? (() => {
                  const selItem = items.find(it => it.id === selectedStockCardItemId);
                  if (!selItem) return null;

                  // Dynamic compilation of transaction histories
                  const stockTransactions = [];
                  
                  // Baseline stocking allocation
                  stockTransactions.push({
                    date: "Awal Sistem",
                    type: "Inisialisasi Master",
                    ref: "Katalog Perdana",
                    change: `+${selItem.stockQty !== undefined ? selItem.stockQty : 100}`,
                    badge: "bg-indigo-55 text-indigo-705 border-indigo-200"
                  });

                  // Sourcing intakes & distribution deliveries from real operations
                  orders.forEach(o => {
                    const mappedItem = o.items.find(mi => mi.itemId === selItem.id);
                    if (mappedItem) {
                      // Arrival inflow
                      if (o.vendorStatus === "Barang Masuk Gudang Pusat" || o.status === "Selesai" || o.status === "Dikirim") {
                        // SCM vendor ingestion
                        if (o.vendorArrivedDate || o.vendorStatus === "Barang Masuk Gudang Pusat") {
                          stockTransactions.push({
                            date: o.vendorArrivedDate || o.orderDate,
                            type: "SCM Vendor Intake",
                            ref: `Batch: ${o.rekapId || "Kolektif"} (${o.noPemesanan})`,
                            change: `+${mappedItem.qtyOrdered}`,
                            badge: "bg-emerald-50 text-emerald-700 border-emerald-200"
                          });
                        }
                      }

                      // Site RS outbound distributions
                      if (o.status === "Dikirim" || o.status === "Selesai") {
                        stockTransactions.push({
                          date: o.orderDate,
                          type: `Outbound RS: ${o.clientRS}`,
                          ref: o.noPemesanan,
                          change: `-${mappedItem.qtyOrdered}`,
                          badge: "bg-rose-55 text-rose-705 border-rose-105"
                        });
                      }
                    }
                  });

                  return (
                    <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in-down">
                      <div className="flex justify-between items-center border-b pb-3">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-black uppercase text-slate-400">Timeline Audit Log</span>
                          <h3 className="text-xs font-black text-slate-805 uppercase">Ledger Kartu Stok : {selItem.name}</h3>
                        </div>
                        
                        <div className="text-right text-xs bg-indigo-50 border p-2 rounded-xl">
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Stok Logistik Pusat:</span>
                          <strong className="font-mono text-indigo-705 font-black text-sm">{selItem.stockQty !== undefined ? selItem.stockQty : 100} {selItem.unit}</strong>
                        </div>
                      </div>

                      {/* Timeline Ledger Record table */}
                      <div className="border rounded-xl ... overscroll-none overflow-hidden bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-450 font-black tracking-widest text-[9.5px] uppercase border-b">
                              <th className="p-2.5 pl-4">Tanggal Ledger</th>
                              <th className="p-2.5 font-extrabold">Tipe Gerakan</th>
                              <th className="p-2.5">Nomor Referensi SCM</th>
                              <th className="p-2.5 text-center">Mutasi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {stockTransactions.map((tx, idx) => (tx.type && (
                              <tr key={idx} className="hover:bg-slate-50/30">
                                <td className="p-2.5 pl-4 font-mono text-slate-500">{tx.date}</td>
                                <td className="p-2.5 font-bold text-slate-800">{tx.type}</td>
                                <td className="p-2.5 font-mono text-slate-450">{tx.ref}</td>
                                <td className="p-2.5 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10.5px] font-black tracking-wide border ${
                                    tx.change.startsWith('+')
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                      : 'bg-rose-50 text-rose-700 border-rose-100'
                                  }`}>
                                    {tx.change} {selItem.unit}
                                  </span>
                                </td>
                              </tr>
                            )))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="bg-white border rounded-2xl p-10 text-center text-slate-400 space-y-3">
                    <Layers className="w-12 h-12 text-slate-300 mx-auto opacity-75" />
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-550">Silakan Pilih Barang di Menu Kiri</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Lalu lintas kartu stok akan menghitung seluruh andil mutasi awal sistem, penambahan stok atas datang barang dari vendor (SCM Inflow), dan pengurangan stok atas serah terima unit dikirim ke Site RS (SCM Outflow).
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* INFORMATION CARD FOOTER */}
          <div className="bg-slate-50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-black text-slate-705 dark:text-slate-350 uppercase tracking-wide">💡 Ketentuan Master Sourcing & Pricing</h4>
            <p className="text-[11px] text-slate-550 leading-relaxed font-semibold">
              Seluruh rekap harga dihitung real-time mengutamakan price harian ter-update. Perubahan harga tidak memengaruhi invoice lama yang berstatus Pelunasan/Selesai. Kartu stok terlaporkan berkala melalui audit log sistem otomatis.
            </p>
          </div>

        </div>
      )}

      {/* FORM: NEW ORDER MODAL DISABLED IN FAVOR OF INLINE WORKSPACE FORM */}
      {false && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="bg-slate-50 dark:bg-slate-955 px-6 py-4 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Formulir Pesanan ATK Baru</h3>
              </div>
              <button
                onClick={() => setIsCreatingOrder(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full bg-white dark:bg-slate-800 shadow-xs cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Pilih Site RS Tujuan Pengadaan <span className="text-red-500">*</span></label>
                  {isSiteRestricted ? (
                    <input
                      type="text"
                      disabled
                      value={orderClientRS}
                      className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 text-xs font-bold rounded-lg px-3 py-2 text-slate-600"
                    />
                  ) : (
                    <select
                      value={orderClientRS}
                      onChange={(e) => setOrderClientRS(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-indigo-500"
                    >
                      {clients.map(cl => (
                        <option key={cl.id} value={cl.namaRS}>{cl.namaRS}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tanggal Pemesanan / Pengajuan <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 rounded-lg px-3 py-2 text-xs font-black focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* RETAIL CART ADD ITEMS INLINE */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-4 border border-slate-200 dark:border-slate-805 rounded-2xl space-y-3">
                <span className="text-[10px] uppercase tracking-widest font-black text-indigo-600 block">🛍️ Pencarian & Input Barang</span>
                
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-[9px] font-bold text-slate-400 mb-1">Pilih Barang dari Katalog Master</label>
                    <select
                      value={selectedCartItemId}
                      onChange={(e) => setSelectedCartItemId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Pilih Jenis Barang ATK --</option>
                      {items.map(it => (
                        <option key={it.id} value={it.id}>{it.name} [{it.unit}] - {formatIDR(it.price)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-28">
                    <label className="block text-[9px] font-bold text-slate-400 mb-1">Jumlah</label>
                    <input
                      type="number"
                      min="1"
                      value={selectedCartItemQty}
                      onChange={(e) => setSelectedCartItemQty(parseInt(e.target.value) || 1)}
                      className="w-full bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-center font-bold"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={addToCart}
                    className="bg-indigo-600 hover:bg-indigo-550 text-white font-extrabold text-xs px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Sisipkan</span>
                  </button>
                </div>
              </div>

              {/* CART ITEMS REGISTERED TABLE */}
              <div className="border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-950 px-4 py-2 font-black text-[9px] text-slate-450 uppercase border-b tracking-wider">
                  🛒 Keranjang Draf Belanja ATK ({orderCart.length} item)
                </div>
                {orderCart.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 italic text-[11px]">
                    Belum ada barang dimasukkan. Silakan pilih di atas.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 font-bold text-slate-400 tracking-wider text-[10px] border-b">
                        <th className="p-2.5 pl-4">Barang</th>
                        <th className="p-2.5 text-center">Jumlah</th>
                        <th className="p-2.5">Harga</th>
                        <th className="p-2.5">Total</th>
                        <th className="p-2.5 pr-4 text-center">Batal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/85">
                      {orderCart.map((c, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 pl-4 font-black text-slate-800 dark:text-slate-100">{c.item.name}</td>
                          <td className="p-2.5 text-center font-mono font-bold">{c.qty} {c.item.unit}</td>
                          <td className="p-2.5 font-mono text-slate-450">{formatIDR(c.item.price)}</td>
                          <td className="p-2.5 font-mono font-black text-slate-705 dark:text-slate-205">{formatIDR(c.qty * c.item.price)}</td>
                          <td className="p-2.5 pr-4 text-center">
                            <button
                              type="button"
                              onClick={() => removeFromCart(idx)}
                              className="text-red-500 hover:bg-red-50 p-1 rounded cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* TOTAL ROW */}
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100/50">
                <span className="text-xs font-extrabold text-slate-550">ESTIMASI TOTAL PENGADAAN BELANJA:</span>
                <span className="font-mono text-sm font-black text-slate-900 dark:text-indigo-400">
                  {formatIDR(orderCart.reduce((sum, c) => sum + (c.qty * c.item.price), 0))}
                </span>
              </div>

            </div>

            <div className="bg-slate-50 dark:bg-slate-955 px-6 py-4 border-t border-slate-150 dark:border-slate-800 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsCreatingOrder(false)}
                className="bg-white border text-slate-600 text-xs font-black px-4 py-2 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Tutup / Batalkan
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleCreateOrder(true)}
                  className="bg-slate-200 text-slate-700 hover:bg-slate-250 font-black text-xs px-4 py-2 rounded-xl cursor-pointer"
                >
                  Simpan Draf 💾
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateOrder(false)}
                  className="bg-indigo-600 hover:bg-indigo-550 text-white font-extrabold text-xs px-5 py-2 rounded-xl cursor-pointer select-none transition-all shadow-md"
                >
                  Ajukan Sekarang 🚀
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL PRINT FACTUR: FAKTUR PENYERAHAN BARANG ATK SEMENTARA (Aesthetic printable popup) */}
      {printOrderId && printOrder && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
            
            {/* Action Bar inside printable modal but visible only on screen */}
            <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center justify-between pointer-events-auto screen-only">
              <div className="flex items-center gap-1">
                <Printer className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-extrabold uppercase text-slate-650 tracking-wider">Preview Bukti Faktur Sementara</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Print</span>
                </button>
                <button
                  onClick={() => setPrintOrderId(null)}
                  className="bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Tutup [X]
                </button>
              </div>
            </div>

            {/* PRINT WORKSPACE Area */}
            <div id="print-area" className="p-8 overflow-y-auto flex-1 font-serif text-[11.5px] leading-relaxed space-y-6">
              
              {/* Kop Surat / Header */}
              <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-4">
                <div>
                  <h1 className="text-sm font-black tracking-widest uppercase font-serif text-slate-900">PT. MEDIKA KSO INDONESIA</h1>
                  <p className="text-[10px] font-sans text-emerald-600 uppercase font-black tracking-wide leading-tight">DIVISI LOGISTIK & SUPPLY CHAIN MANAGEMENT (ATK)</p>
                  <p className="text-[9px] font-sans text-slate-500">Penyedia Khusus Kertas Thermal, Ribbon Printer, & Alat Tulis Kantor Terintegrasi SIMRS</p>
                  <p className="text-[8px] font-sans text-slate-400">Head Office: Grand Synapsis Tower, Floor 12A, Jakarta | Email: logistik@medika-kso.co.id</p>
                </div>
                <div className="text-right font-sans">
                  <span className="border-2 border-emerald-600 text-emerald-600 bg-emerald-50 text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider block">
                    SLIP SERAH TERIMA LOGISTIK ATK
                  </span>
                  <div className="text-[8px] font-mono text-slate-400 mt-1">Sistem Ref ID: {printOrder.id}</div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-1 py-1">
                <h3 className="font-serif font-black uppercase text-xs tracking-wider border-b border-dashed border-emerald-500 pb-1 w-fit mx-auto text-slate-900">
                  SURAT JALAN & FAKTUR REALISASI BARANG ATK (SITE RS)
                </h3>
                <p className="text-xs font-sans font-bold text-slate-700">No. Faktur Logistik: &nbsp;{printOrder.fakturSementaraNo || printOrder.noPemesanan}</p>
              </div>

              {/* Metadata details */}
              <div className="grid grid-cols-2 gap-4 text-[11px] font-sans border border-slate-200 p-3 rounded-xl bg-slate-55/65">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">ASAL PENGIRIMAN / LOGISTIK:</p>
                  <p className="text-slate-800 font-bold">PT. Medika KSO Indonesia (Gudang SCM Pusat)</p>
                  <p className="text-slate-600">Diserahkan Melalui: <b>{printOrder.deliveredToRSBy || printOrder.createdBy} (Site Coordinator)</b></p>
                  <p className="text-slate-600">Tanggal Pengadaan: {printOrder.deliveredToRSDate || "―"}</p>
                </div>
                <div className="space-y-1 border-l pl-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">UNIT PENERIMA / RUMAH SAKIT:</p>
                  <p className="text-emerald-700 font-black uppercase font-sans">{printOrder.clientRS}</p>
                  <p className="text-slate-600">Bagian / Unit Tujuan: <b>Logistik & Rumah Tangga RS</b></p>
                  <p className="text-slate-600">Ref No. Pemesanan Asal: <span className="font-mono font-bold text-slate-850 bg-slate-100 px-1 rounded">{printOrder.noPemesanan}</span></p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse border border-slate-350 text-[11px] font-serif">
                <thead>
                  <tr className="bg-slate-50 font-bold border-b-2 border-slate-355 text-slate-800">
                    <th className="border border-slate-350 p-2 text-center w-8">No</th>
                    <th className="border border-slate-350 p-2 text-left">Deskripsi Barang (Atribut Kertas & ATK SIMRS)</th>
                    <th className="border border-slate-350 p-2 text-center w-14">Satuan</th>
                    <th className="border border-slate-350 p-2 text-center w-12">Qty Riil</th>
                    <th className="border border-slate-350 p-2 text-right w-24">Harga (Rp)</th>
                    <th className="border border-slate-350 p-2 text-right w-24">Subtotal (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {printOrder.items.map((it, idx) => {
                    const consumedQty = it.qtyReceived > 0 ? it.qtyReceived : (it.qtyShipped > 0 ? it.qtyShipped : it.qtyOrdered);
                    return (
                      <tr key={it.itemId} className="hover:bg-slate-50/50">
                        <td className="border border-slate-355 p-2 text-center font-sans text-slate-600">{idx + 1}</td>
                        <td className="border border-slate-355 p-2 font-serif font-semibold text-slate-800">{it.name}</td>
                        <td className="border border-slate-355 p-2 text-center font-sans uppercase text-[10px] text-slate-500">{it.unit}</td>
                        <td className="border border-slate-355 p-2 text-center font-sans font-bold text-slate-900">{consumedQty}</td>
                        <td className="border border-slate-355 p-2 text-right font-sans text-slate-600">{it.price.toLocaleString("id-ID")}</td>
                        <td className="border border-slate-355 p-2 text-right font-sans font-black text-slate-900">{(it.price * consumedQty).toLocaleString("id-ID")}</td>
                      </tr>
                    );
                  })}
                  
                  {/* Summary Rows */}
                  <tr className="border-t border-slate-400 font-bold bg-slate-50/30">
                    <td colSpan={5} className="border border-slate-350 p-2 text-right uppercase tracking-wider text-[10px] text-slate-500">Total Belanja ATK Bruto:</td>
                    <td className="border border-slate-350 p-2 text-right font-sans font-black text-slate-900">
                      {actualCost(printOrder).toLocaleString("id-ID")}
                    </td>
                  </tr>
                  <tr className="font-bold text-slate-500">
                    <td colSpan={5} className="border border-slate-350 p-2 text-right text-[10px]">Estimasi PPN (Pajak Pertambahan Nilai 11%):</td>
                    <td className="border border-slate-350 p-2 text-right font-sans text-slate-700">
                      {Math.round(actualCost(printOrder) * 0.11).toLocaleString("id-ID")}
                    </td>
                  </tr>
                  <tr className="font-bold underline text-xs bg-emerald-50/20 text-emerald-900">
                    <td colSpan={5} className="border border-slate-350 p-2 text-right uppercase tracking-wider text-[10px] text-emerald-800 font-sans font-black">Total Akhir Penyerahan Logistik ATK:</td>
                    <td className="border border-slate-350 p-2 text-right font-sans font-black text-emerald-900">
                      {Math.round(actualCost(printOrder) * 1.11).toLocaleString("id-ID")}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Tanda Tangan */}
              <div className="pt-8 text-sans font-sans">
                <div className="grid grid-cols-2 text-center">
                  <div className="space-y-12">
                    <p className="text-slate-600">PIHAK PERTAMA (YANG MENYERAHKAN)<br /><span className="font-bold text-slate-800">PT. Medika KSO Indonesia (SCM Site)</span></p>
                    <div className="space-y-0.5">
                      <p className="font-bold underline text-slate-900">(&nbsp;{printOrder.deliveredToRSBy || "......................................."}&nbsp;)</p>
                      <p className="text-[10px] text-slate-500 leading-none">Petugas Site Coordinator</p>
                    </div>
                  </div>
                  <div className="space-y-12">
                    <p className="text-slate-600">PIHAK KEDUA (YANG MENERIMA)<br /><span className="font-bold text-slate-800">Unit Logistik / Manajemen Rumah Sakit</span></p>
                    <div className="space-y-0.5">
                      <p className="font-bold underline text-slate-900">(&nbsp;.......................................&nbsp;)</p>
                      <p className="text-[10px] text-slate-500 leading-none">Nama Jelas & Cap Resmi RS</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ketentuan Penyerahan */}
              <div className="border-t border-emerald-300 pt-3 text-[10px] text-slate-500 font-sans italic space-y-1">
                <p><b>Catatan Khusus KSO ATK:</b></p>
                <p>* Bukti Faktur Sementara ini berlaku sah saat ditandatangani perwakilan kedua belah pihak di site Rumah Sakit.</p>
                <p>** Rincian rekapitulasi realisasi logistik ATK ini diverifikasi oleh Site Coordinator dan secara otomatis disinkronisasikan ke sistem Penagihan Pusat Medika.</p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL PRINT REKAP BELANJA VENDOR COHESIVE POPUP */}
      {printRekapBatchId && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
            
            {/* Action Bar */}
            <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center justify-between pointer-events-auto screen-only">
              <div className="flex items-center gap-1.5 animate-pulse">
                <Printer className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Cetak Rekap Belanja Vendor ({printRekapBatchId === "DRAFT" ? "Draft Baru" : printRekapBatchId})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-750 text-white font-black text-xs px-4 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintRekapBatchId(null)}
                  className="bg-slate-200 hover:bg-slate-255 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Tutup [X]
                </button>
              </div>
            </div>

            {/* Print Area Workspace */}
            <div id="print-area" className="p-8 overflow-y-auto flex-1 font-serif text-[11.5px] leading-relaxed space-y-6">
              
              {/* Kop Surat Header */}
              <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-4">
                <div>
                  <h1 className="text-sm font-black tracking-widest uppercase font-serif text-slate-900">PT. MEDIKA KSO INDONESIA</h1>
                  <p className="text-[10px] font-sans text-indigo-650 uppercase font-black tracking-wide leading-tight">DIVISI LOGISTIK & SUPPLY CHAIN MANAGEMENT (SCM)</p>
                  <p className="text-[9px] font-sans text-slate-500">Formulir Consolidation Purchase Order - Pengadaan Belanja Kolektif Kantor Pusat</p>
                  <p className="text-[8px] font-sans text-slate-400">Head Office: Grand Synapsis Tower, Floor 12A, Jakarta | Email: logistik@medika-kso.co.id</p>
                </div>
                <div className="text-right font-sans">
                  <span className="border-2 border-indigo-600 text-indigo-650 bg-indigo-50/50 text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider block">
                    KSO VENDOR PROCUREMENT REKAP
                  </span>
                  <div className="text-[8px] font-mono text-slate-400 mt-1">
                    Status: {printRekapBatchId === "DRAFT" ? "DRAFT REKAPAN" : "BATCH FIXED"}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-1 py-1">
                <h3 className="font-serif font-black uppercase text-xs tracking-wider border-b border-dashed border-indigo-500 pb-1 w-fit mx-auto text-slate-900">
                  REKAPITULASI PEMBANTU BARANG BELANJA VENDOR (KONSOLIDASI NASIONAL KSO)
                </h3>
                <p className="text-xs font-sans font-bold text-slate-700">
                  ID REKAP: &nbsp; {printRekapBatchId === "DRAFT" ? "(DRAF KEBUTUHAN BELUM DIKONFIRMASI)" : printRekapBatchId}
                </p>
              </div>

              {/* Batches metadata */}
              {(() => {
                const isDraft = printRekapBatchId === "DRAFT";
                const activeOrders = isDraft 
                  ? orders.filter(o => o.status === 'Diajukan' && !o.rekapId)
                  : orders.filter(o => o.rekapId === printRekapBatchId);

                const sampleOrd = activeOrders[0] || {};
                const vendorNameStr = isDraft ? (vendorName || "Belum Ditentukan") : (sampleOrd.vendorName || "Tidak Diketahui");
                const notesStr = isDraft ? (vendorOrderNotes || "Tidak ada catatan") : (sampleOrd.vendorNotes || "Tidak ada catatan");
                const datePrintedStr = new Date().toLocaleDateString("id-ID", {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });

                // Compile consolidated map
                const consolidated: Record<string, { itemId: string; name: string; unit: string; price: number; qtyNeededBySites: number; qtyBufferLogistics: number }> = {};
                
                activeOrders.forEach(order => {
                  const isSCMStock = order.clientRS.includes("GUDANG PUSAT SCM");
                  order.items.forEach(it => {
                    if (!consolidated[it.itemId]) {
                      consolidated[it.itemId] = {
                        itemId: it.itemId,
                        name: it.name,
                        unit: it.unit,
                        price: it.price,
                        qtyNeededBySites: 0,
                        qtyBufferLogistics: 0
                      };
                    }
                    if (isSCMStock) {
                      consolidated[it.itemId].qtyBufferLogistics += it.qtyOrdered;
                    } else {
                      consolidated[it.itemId].qtyNeededBySites += it.qtyOrdered;
                    }
                  });
                });

                if (isDraft) {
                  // Mix-in screen inputs for additional stock quantities
                  Object.entries(extraStockQuantities).forEach(([itemId, qty]) => {
                    if ((qty as number) > 0) {
                      if (!consolidated[itemId]) {
                        const originalItem = items.find(i => i.id === itemId);
                        if (originalItem) {
                          consolidated[itemId] = {
                            itemId,
                            name: originalItem.name,
                            unit: originalItem.unit,
                            price: originalItem.priceToday || originalItem.price,
                            qtyNeededBySites: 0,
                            qtyBufferLogistics: 0
                          };
                        }
                      }
                      if (consolidated[itemId]) {
                        consolidated[itemId].qtyBufferLogistics = qty as number;
                      }
                    }
                  });

                  // Ensure any manual items included with zero stock but configured in vLogisticsCustomItems show up
                  vLogisticsCustomItems.forEach(itemId => {
                    if (!consolidated[itemId]) {
                      const originalItem = items.find(i => i.id === itemId);
                      if (originalItem) {
                        consolidated[itemId] = {
                          itemId,
                          name: originalItem.name,
                          unit: originalItem.unit,
                          price: originalItem.priceToday || originalItem.price,
                          qtyNeededBySites: 0,
                          qtyBufferLogistics: 0
                        };
                      }
                    }
                  });
                }

                const itemList = Object.values(consolidated);
                const grandTotal = itemList.reduce((sum, item) => sum + ((item.qtyNeededBySites + item.qtyBufferLogistics) * item.price), 0);

                return (
                  <div className="space-y-4 font-sans text-slate-800">
                    <div className="grid grid-cols-2 gap-4 text-[10.5px] font-sans border border-slate-200 p-3 rounded-xl bg-slate-50/50">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">SASARAN PENGADAAN VENDOR:</p>
                        <p className="text-slate-800 font-bold text-xs">Nama Partner Vendor: <span className="text-indigo-700 font-black">{vendorNameStr}</span></p>
                        <p className="text-slate-655 font-semibold">Tujuan Pengiriman: <b>Gudang Pusat Logistik SCM KSO</b></p>
                        <p className="text-slate-600">Catatan Rekap Vendor: &ldquo;{notesStr}&rdquo;</p>
                      </div>
                      <div className="space-y-1 border-l pl-4">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">TANGGAL & PERTANGGUNGJAWABAN:</p>
                        <p className="text-slate-850">Tanggal Proses Cetak: <b>{datePrintedStr}</b></p>
                        <p className="text-slate-600">Total Keterlibatan Site RS: <b>{activeOrders.filter(o => !o.clientRS.includes("GUDANG PUSAT SCM")).length} Site Pengaju</b></p>
                        <p className="text-slate-600 font-mono text-[9px]">User Cetak: {currentUser?.name || currentUser?.username || "Logistik Kantor Pusat"}</p>
                      </div>
                    </div>

                    <p className="text-[10px] font-sans text-slate-500 leading-relaxed">
                      Berikut rincian total konsolidasi unit barang ATK yang dipesan dari cabang (site) dan alokasi tambahan (buffer stock) logistik pusat:
                    </p>

                    <table className="w-full text-left font-sans text-[10.5px] border-collapse border border-slate-250">
                      <thead>
                        <tr className="bg-slate-100 font-black text-slate-850 uppercase text-[9px] border-b border-slate-250">
                          <th className="p-2 border border-slate-250 text-center w-8">No.</th>
                          <th className="p-2 border border-slate-250">Nama ATK / Spesifikasi Barang</th>
                          <th className="p-2 border border-slate-250 text-center w-12">Satuan</th>
                          <th className="p-2 border border-slate-250 text-center w-16">Porsi Site</th>
                          <th className="p-2 border border-slate-250 text-center w-16 bg-amber-50/50 text-amber-900 font-bold">Porsi SCM (Stok)</th>
                          <th className="p-2 border border-slate-250 text-center w-16 bg-indigo-50/30 font-black text-indigo-950">Total Order</th>
                          <th className="p-2 border border-slate-250 text-right w-24">Harga Partner</th>
                          <th className="p-2 border border-slate-250 text-right w-28 pr-4">Subtotal Nilai</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemList.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-6 text-center text-slate-400 italic">Tidak ada rincian item dalam rekap ini.</td>
                          </tr>
                        ) : (
                          itemList.map((item, idx) => {
                            const totalQty = item.qtyNeededBySites + item.qtyBufferLogistics;
                            const subTotal = totalQty * item.price;
                            return (
                              <tr key={item.itemId} className="divide-x divide-slate-200 border-b border-slate-205">
                                <td className="p-2 text-center text-slate-500 font-mono">{idx + 1}</td>
                                <td className="p-2 font-bold text-slate-900">{item.name}</td>
                                <td className="p-2 text-center uppercase">{item.unit}</td>
                                <td className="p-2 text-center font-mono">{item.qtyNeededBySites}</td>
                                <td className="p-2 text-center font-mono bg-amber-50/20 text-amber-950 font-bold">{item.qtyBufferLogistics}</td>
                                <td className="p-2 text-center font-mono bg-indigo-50/10 font-black text-indigo-950">{totalQty}</td>
                                <td className="p-2 text-right font-mono">{formatIDR(item.price)}</td>
                                <td className="p-2 text-right font-mono font-black text-slate-900 pr-4">{formatIDR(subTotal)}</td>
                              </tr>
                            );
                          })
                        )}
                        <tr className="bg-indigo-50/10 font-extrabold text-slate-850">
                          <td colSpan={5} className="p-2.5 text-right text-[9.5px]">ESTIMASI TOTAL PEMBELIAN VENDOR (BELUM TERMASUK PPN INTRA):</td>
                          <td colSpan={3} className="p-2.5 text-right text-indigo-750 font-mono font-black text-xs pr-4">
                            {formatIDR(grandTotal)}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Tanda Tangan */}
                    <div className="pt-8 text-sans font-sans">
                      <div className="grid grid-cols-2 text-center text-[10.5px]">
                        <div className="space-y-12">
                          <p className="text-slate-600">YANG MENYETUJUI / PEMESAN<br /><span className="font-bold text-slate-800">Manajer SCM Kantor Pusat</span></p>
                          <div className="space-y-0.5">
                            <p className="font-bold underline text-slate-900">(&nbsp;{currentUser?.name || currentUser?.username || "Logistik Kantor Pusat"}&nbsp;)</p>
                            <p className="text-[10px] text-slate-500 leading-none">Kepala Logistik & SCM</p>
                          </div>
                        </div>
                        <div className="space-y-12">
                          <p className="text-slate-600">REKANAN REKTORAT / VENDOR KAPASITAS<br /><span className="font-bold text-slate-800">Staff Admin Pihak Vendor Partner</span></p>
                          <div className="space-y-0.5">
                            <p className="font-bold underline text-slate-900">(&nbsp;.......................................&nbsp;)</p>
                            <p className="text-[10px] text-slate-500 leading-none">Account Manager / Penanggung Jawab</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-indigo-300 pt-3 text-[10px] text-slate-500 font-sans italic space-y-1">
                      <p><b>Catatan Sourcing KSO SCM:</b></p>
                      <p>* Rincian rekapitulasi kolektif ini sah dan diunduh langsung dari platform logistik KSO Medika Indonesia.</p>
                      <p>** Atas kedatangan barang vendor, SCM Pusat akan memproses realisasi porsi gudang dan merealisasikan kuota per wilayah RS bersangkutan.</p>
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      )}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-55 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="space-y-1.5 text-center">
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">
                {confirmDialog.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {confirmDialog.message}
              </p>
            </div>
            <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 bg-slate-150 hover:bg-slate-200 text-slate-700 text-xs font-black py-2 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-2 rounded-xl cursor-pointer animate-pulse"
              >
                Ya, Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
