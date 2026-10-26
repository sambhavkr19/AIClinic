import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Invoice, Payment, Patient, Service } from '../../types/index.js';
import {
  Receipt,
  IndianRupee,
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  AlertCircle,
  TrendingUp,
  FileText,
  RotateCcw,
  Sparkles,
  QrCode,
  ShieldCheck
} from 'lucide-react';

export const BillingView: React.FC = () => {
  const { user, clinic } = useAuth();
  const isOwner = user?.role === 'owner';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [dailySummary, setDailySummary] = useState<{
    date: string;
    total_collected: number;
    cash_total: number;
    upi_total: number;
    card_total: number;
    netbanking_total: number;
    total_outstanding: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New Invoice Modal
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState<boolean>(false);
  const [invPatientId, setInvPatientId] = useState<string>('');
  const [invItems, setInvItems] = useState<
    Array<{ description: string; qty: number; unit_price: number; amount: number }>
  >([
    { description: 'General OPD Consultation', qty: 1, unit_price: 500, amount: 500 }
  ]);
  const [invDiscount, setInvDiscount] = useState<number>(0);
  const [invDiscountReason, setInvDiscountReason] = useState<string>('');
  const [invTax, setInvTax] = useState<number>(0);
  const [invNotes, setInvNotes] = useState<string>('');

  // Record Payment Modal
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'Cash' | 'UPI' | 'Card' | 'NetBanking'>('UPI');
  const [payReference, setPayReference] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');

  // Refund Modal (Owner only)
  const [refundPaymentId, setRefundPaymentId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState<string>('');

  // Print Invoice Modal
  const [printInvoiceTarget, setPrintInvoiceTarget] = useState<Invoice | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [invRes, patRes, srvRes, sumRes] = await Promise.all([
        api.getInvoices(),
        api.getPatients(),
        api.getServices(),
        api.getDailySummary()
      ]);
      setInvoices(invRes.invoices);
      setPatients(patRes.patients);
      setServices(srvRes.services);
      setDailySummary(sumRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load billing records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clinic?.id]);

  const handleAddItem = (service?: Service) => {
    if (service) {
      setInvItems([
        ...invItems,
        { description: service.name, qty: 1, unit_price: service.fee, amount: service.fee }
      ]);
    } else {
      setInvItems([
        ...invItems,
        { description: '', qty: 1, unit_price: 0, amount: 0 }
      ]);
    }
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updated = [...invItems];
    const item = { ...updated[index], [field]: value };
    if (field === 'qty' || field === 'unit_price') {
      item.amount = (Number(item.qty) || 1) * (Number(item.unit_price) || 0);
    }
    updated[index] = item;
    setInvItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setInvItems(invItems.filter((_, i) => i !== index));
  };

  const subtotal = invItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const totalAmount = Math.max(0, subtotal - (Number(invDiscount) || 0) + (Number(invTax) || 0));

  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invPatientId) {
      alert('Please select a patient.');
      return;
    }
    if (invDiscount > 0 && !invDiscountReason.trim()) {
      alert('An authorized discount reason is mandatory when applying a discount.');
      return;
    }

    try {
      await api.createInvoice({
        patient_id: invPatientId,
        items: invItems,
        discount_amount: invDiscount,
        discount_reason: invDiscountReason,
        tax_amount: invTax,
        notes: invNotes
      });

      setShowCreateInvoiceModal(false);
      fetchData();
    } catch (err: any) {
      alert(`Invoice creation failed: ${err.message}`);
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;

    if (payAmount <= 0 || payAmount > paymentInvoice.balance_due) {
      alert(`Payment amount must be between ₹1 and ₹${paymentInvoice.balance_due}.`);
      return;
    }

    if (payMethod === 'UPI' && !payReference.trim()) {
      alert('Please provide the UPI Transaction UTR / Reference ID for verified audit.');
      return;
    }

    try {
      await api.recordPayment(paymentInvoice.id, {
        amount: payAmount,
        payment_method: payMethod,
        transaction_reference: payReference,
        notes: payNotes
      });

      setPaymentInvoice(null);
      setPayReference('');
      setPayNotes('');
      fetchData();
    } catch (err: any) {
      alert(`Recording payment failed: ${err.message}`);
    }
  };

  const handleRefundSubmit = async () => {
    if (!refundPaymentId || !refundReason.trim()) return;
    try {
      await api.refundPayment(refundPaymentId, refundReason);
      setRefundPaymentId(null);
      setRefundReason('');
      fetchData();
    } catch (err: any) {
      alert(`Refund failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-600" />
            <span>Billing, Invoices & Collections</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cash, UPI (with UTR verification), discounts with approval logs, and tax receipt generation.
          </p>
        </div>

        <button
          onClick={() => {
            setInvItems([
              {
                description: 'General OPD Consultation',
                qty: 1,
                unit_price: clinic?.consultation_fee_default || 500,
                amount: clinic?.consultation_fee_default || 500
              }
            ]);
            setInvDiscount(0);
            setInvDiscountReason('');
            setShowCreateInvoiceModal(true);
          }}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Generate New Invoice
        </button>
      </div>

      {/* Daily Collection Summary Cards */}
      {dailySummary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">Today's Total Collection</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
              ₹{dailySummary.total_collected.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-1">
              Verified & Ledgered
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-teal-600" /> UPI Collections
            </div>
            <div className="text-2xl font-bold text-teal-900 font-mono mt-1">
              ₹{dailySummary.upi_total.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400">GPay, PhonePe, Paytm</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">Cash Collected</div>
            <div className="text-2xl font-bold text-amber-900 font-mono mt-1">
              ₹{dailySummary.cash_total.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400">Front desk receipts</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">Card & NetBanking</div>
            <div className="text-2xl font-bold text-slate-800 font-mono mt-1">
              ₹{(dailySummary.card_total + dailySummary.netbanking_total).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400">POS & Online</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">Total Dues Pending</div>
            <div className="text-2xl font-bold text-rose-700 font-mono mt-1">
              ₹{dailySummary.total_outstanding.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-rose-600 font-medium">To be collected</div>
          </div>
        </div>
      )}

      {/* Invoices List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Patient Invoices & Payment Ledger ({invoices.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No invoices generated yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Patient Details</th>
                  <th className="py-3 px-4">Subtotal & Discount</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid / Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-900">
                      {inv.invoice_number}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{inv.patient_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{inv.patient_uid}</div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div>₹{inv.subtotal}</div>
                      {inv.discount_amount > 0 && (
                        <div className="text-[11px] text-rose-600">
                          -₹{inv.discount_amount} (Discount)
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      ₹{inv.total_amount}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="text-emerald-700 font-semibold">Paid: ₹{inv.paid_amount}</div>
                      {inv.balance_due > 0 ? (
                        <div className="text-rose-600 font-bold">Due: ₹{inv.balance_due}</div>
                      ) : (
                        <div className="text-[10px] text-slate-400">Nil</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : inv.status === 'Partially Paid'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : inv.status === 'Refunded'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      {inv.balance_due > 0 && (
                        <button
                          onClick={() => {
                            setPaymentInvoice(inv);
                            setPayAmount(inv.balance_due);
                          }}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded font-semibold text-xs"
                        >
                          Record Payment
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setPrintInvoiceTarget(inv);
                          setTimeout(() => window.print(), 100);
                        }}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded border border-slate-200 text-xs font-medium"
                        title="Print Official Tax Receipt"
                      >
                        <Printer className="w-3.5 h-3.5 inline mr-1" /> Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE INVOICE MODAL */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Create Patient Invoice</h3>
              <button
                onClick={() => setShowCreateInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Patient *</label>
                <select
                  required
                  value={invPatientId}
                  onChange={e => setInvPatientId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.patient_uid}) • {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bill Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-700">Billing Line Items *</label>
                  <div className="flex gap-2">
                    <select
                      onChange={e => {
                        const s = services.find(srv => srv.id === e.target.value);
                        if (s) handleAddItem(s);
                        e.target.value = '';
                      }}
                      className="border border-slate-300 rounded px-2 py-1 text-slate-600"
                    >
                      <option value="">+ Add Service Catalog</option>
                      {services.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} (₹{s.fee})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleAddItem()}
                      className="px-2 py-1 text-teal-700 border border-teal-300 rounded hover:bg-teal-50 font-semibold"
                    >
                      + Custom Item
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {invItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Description (e.g. ECG Screening)"
                        value={item.description}
                        onChange={e => handleUpdateItem(idx, 'description', e.target.value)}
                        className="flex-1 border border-slate-300 rounded p-1.5 focus:outline-none"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.qty}
                        onChange={e => handleUpdateItem(idx, 'qty', e.target.value)}
                        className="w-14 border border-slate-300 rounded p-1.5 font-mono focus:outline-none text-center"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Rate ₹"
                        value={item.unit_price}
                        onChange={e => handleUpdateItem(idx, 'unit_price', e.target.value)}
                        className="w-24 border border-slate-300 rounded p-1.5 font-mono focus:outline-none"
                      />
                      <span className="w-20 font-mono font-bold text-right text-slate-800">
                        ₹{item.amount}
                      </span>
                      {invItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtotal, Discount & Tax */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-mono">
                <div className="flex justify-between text-slate-600 font-sans">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold">₹{subtotal}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-slate-700 mb-0.5">
                      Discount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={invDiscount}
                      onChange={e => setInvDiscount(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-slate-700 mb-0.5">
                      Discount Reason (Mandatory if discount is applied)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior citizen courtesy, owner approved"
                      value={invDiscountReason}
                      onChange={e => setInvDiscountReason(e.target.value)}
                      className="w-full border border-slate-300 rounded p-1.5 font-sans"
                    />
                  </div>
                </div>

                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-300 font-sans">
                  <span>Total Payable:</span>
                  <span className="font-mono text-teal-800">₹{totalAmount}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Internal Notes</label>
                <input
                  type="text"
                  placeholder="Optional billing note..."
                  value={invNotes}
                  onChange={e => setInvNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold shadow-xs"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {paymentInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Record Verified Payment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Invoice: <span className="font-mono font-bold text-teal-800">{paymentInvoice.invoice_number}</span> • Patient: {paymentInvoice.patient_name}
            </p>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">Total Invoice Amount:</span>
                  <span className="font-mono font-bold">₹{paymentInvoice.total_amount}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">Already Paid:</span>
                  <span className="font-mono text-emerald-700 font-bold">₹{paymentInvoice.paid_amount}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Balance Due:</span>
                  <span className="font-mono text-rose-600">₹{paymentInvoice.balance_due}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  max={paymentInvoice.balance_due}
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['UPI', 'Cash', 'Card', 'NetBanking'] as const).map(m => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setPayMethod(m)}
                      className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        payMethod === m
                          ? 'border-teal-600 bg-teal-50 text-teal-800'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {m === 'UPI' && <QrCode className="w-3.5 h-3.5" />}
                      {m === 'Card' && <CreditCard className="w-3.5 h-3.5" />}
                      <span>{m}</span>
                    </button>
                  ))}
                </div>
              </div>

              {payMethod === 'UPI' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    UPI UTR / Reference ID * (e.g. 263819401823)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter 12-digit UPI UTR"
                    value={payReference}
                    onChange={e => setPayReference(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Required for financial audit and preventing unverified clicks.
                  </p>
                </div>
              )}

              {payMethod === 'Card' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">POS Approval Code / Card Txn ID</label>
                  <input
                    type="text"
                    placeholder="e.g. POS-8472"
                    value={payReference}
                    onChange={e => setPayReference(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentInvoice(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold shadow-xs"
                >
                  Confirm & Record Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE OFFICIAL TAX INVOICE / RECEIPT */}
      {printInvoiceTarget && (
        <div id="printable-document" className="hidden print:block font-serif text-black p-8 max-w-3xl mx-auto">
          {/* Clinic Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wider">{clinic?.name}</h1>
              <p className="text-xs text-slate-700">{clinic?.tagline}</p>
              <p className="text-xs text-slate-700">{clinic?.address}</p>
              <p className="text-xs text-slate-700">Phone: {clinic?.phone} • Email: {clinic?.email}</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Clinic Reg No: {clinic?.reg_number}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold uppercase">Tax Invoice / Receipt</p>
              <p className="text-sm font-mono font-bold mt-1">{printInvoiceTarget.invoice_number}</p>
              <p className="text-xs text-slate-700">Date: {new Date(printInvoiceTarget.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Patient Details */}
          <div className="bg-slate-100 p-3 rounded mb-4 text-xs grid grid-cols-3 gap-2 border border-slate-300">
            <div>
              <span className="font-bold">Billed To:</span> {printInvoiceTarget.patient_name}
            </div>
            <div>
              <span className="font-bold">Patient UID:</span> {printInvoiceTarget.patient_uid}
            </div>
            <div>
              <span className="font-bold">Contact:</span> {printInvoiceTarget.patient_phone}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-xs border-collapse mb-6">
            <thead>
              <tr className="border-b border-slate-400 text-left font-bold">
                <th className="py-2">Item Description</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Unit Rate (₹)</th>
                <th className="py-2 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {printInvoiceTarget.items?.map((it, idx) => (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="py-2">{it.description}</td>
                  <td className="py-2 text-center">{it.qty}</td>
                  <td className="py-2 text-right font-mono">₹{it.unit_price}</td>
                  <td className="py-2 text-right font-mono">₹{it.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Totals */}
          <div className="flex justify-end text-xs mb-8">
            <div className="w-64 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{printInvoiceTarget.subtotal}</span>
              </div>
              {printInvoiceTarget.discount_amount > 0 && (
                <div className="flex justify-between text-rose-700">
                  <span>Discount:</span>
                  <span>-₹{printInvoiceTarget.discount_amount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-400 font-sans">
                <span>Total Amount:</span>
                <span className="font-mono">₹{printInvoiceTarget.total_amount}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-800">
                <span>Amount Paid:</span>
                <span>₹{printInvoiceTarget.paid_amount}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Balance Due:</span>
                <span>₹{printInvoiceTarget.balance_due}</span>
              </div>
            </div>
          </div>

          {/* Footer & Signature */}
          <div className="mt-12 pt-6 border-t border-slate-400 flex justify-between items-end text-xs">
            <p className="text-[10px] text-slate-500">
              Thank you for visiting {clinic?.name}. For health inquiries, call {clinic?.phone}.
            </p>
            <div className="text-right">
              <div className="font-serif italic font-bold text-sm mb-1">{clinic?.name}</div>
              <p className="text-[10px] text-slate-600">Authorized Billing Officer</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
