import { create } from 'zustand'
import { StatusFilter } from '../utils/account'

export interface AppState {
  activeSection: 'forex' | 'futures';
  setActiveSection: (section: 'forex' | 'futures') => void;

  // Which account the data cards are currently scoped to (undefined = all in section)
  viewAccountId: string | undefined;
  setViewAccountId: (id: string | undefined) => void;

  // Status filter applied to the account selector and data cards
  accountStatusFilter: StatusFilter;
  setAccountStatusFilter: (filter: StatusFilter) => void;

  // Account detail page navigation (undefined = main dashboard)
  detailAccountId: string | undefined;
  setDetailAccountId: (id: string | undefined) => void;

  // Modal states
  isAddFirmOpen: boolean;
  isAddAccountOpen: boolean;
  isAddTradeOpen: boolean;
  setAddFirmOpen: (open: boolean) => void;
  setAddAccountOpen: (open: boolean) => void;
  setAddTradeOpen: (open: boolean) => void;

  // Trade being edited (undefined = create mode)
  editTradeId: string | undefined;
  setEditTradeId: (id?: string) => void;

  // Selected data for forms
  selectedFirmId?: string;
  selectedAccountId?: string;
  setSelectedFirmId: (id?: string) => void;
  setSelectedAccountId: (id?: string) => void;
}

export const useStore = create<AppState>((set) => ({
  activeSection: 'forex',
  // Reset account view and status filter whenever the section toggles
  setActiveSection: (section) => set({ activeSection: section, viewAccountId: undefined, accountStatusFilter: 'all', detailAccountId: undefined }),

  viewAccountId: undefined,
  setViewAccountId: (id) => set({ viewAccountId: id }),

  accountStatusFilter: 'all',
  setAccountStatusFilter: (filter) => set({ accountStatusFilter: filter, viewAccountId: undefined }),

  detailAccountId: undefined,
  setDetailAccountId: (id) => set({ detailAccountId: id, viewAccountId: id }),

  isAddFirmOpen: false,
  isAddAccountOpen: false,
  isAddTradeOpen: false,
  setAddFirmOpen: (open) => set({ isAddFirmOpen: open }),
  setAddAccountOpen: (open) => set({ isAddAccountOpen: open }),
  setAddTradeOpen: (open) => set({ isAddTradeOpen: open }),

  editTradeId: undefined,
  setEditTradeId: (id) => set({ editTradeId: id }),

  selectedFirmId: undefined,
  selectedAccountId: undefined,
  setSelectedFirmId: (id) => set({ selectedFirmId: id }),
  setSelectedAccountId: (id) => set({ selectedAccountId: id }),
}))