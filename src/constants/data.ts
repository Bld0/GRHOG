import { NavItem } from '@/types';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const navItems: NavItem[] = [
  {
    title: 'Дашбоард',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: [], // Empty array as there are no child items for Dashboard
    requiresRole: 'VIEWER' // All roles can access dashboard
  },
  {
    title: 'Хогийн сав',
    url: '/dashboard/bins',
    icon: 'trash',
    shortcut: ['b', 'b'],
    isActive: false,
    items: [], // No child items
    requiresRole: 'VIEWER' // All roles can view bins
  },
  {
    title: 'Карт',
    url: '/dashboard/card',
    icon: 'card',
    shortcut: ['r', 'r'],
    isActive: false,
    items: [], // No child items
    requiresRole: 'VIEWER' // All roles can view cards
  },
  {
    title: 'Ашиглалтын түүх',
    url: '/dashboard/transactions',
    icon: 'transaction',
    shortcut: ['h', 'h'],
    isActive: false,
    items: [], // No child items
    requiresRole: 'VIEWER' // All roles can view transactions
  },
  {
    title: 'Системийн хэрэглэгчид',
    url: '/dashboard/users',
    icon: 'users',
    shortcut: ['u', 'u'],
    isActive: false,
    items: [], // No child items
    requiresRole: 'SUPER_ADMIN' // Only visible to super admin
  },
];

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export const recentSalesData: SaleUser[] = [
  {
    id: 1,
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: '+$1,999.00',
    image: 'https://api.slingacademy.com/public/sample-users/1.png',
    initials: 'OM'
  },
  {
    id: 2,
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/2.png',
    initials: 'JL'
  },
  {
    id: 3,
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: '+$299.00',
    image: 'https://api.slingacademy.com/public/sample-users/3.png',
    initials: 'IN'
  },
  {
    id: 4,
    name: 'William Kim',
    email: 'will@email.com',
    amount: '+$99.00',
    image: 'https://api.slingacademy.com/public/sample-users/4.png',
    initials: 'WK'
  },
  {
    id: 5,
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/5.png',
    initials: 'SD'
  }
];
