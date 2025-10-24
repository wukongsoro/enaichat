/**
 * Billing Period Selector Component
 * 
 * Reusable toggle for Monthly vs Yearly billing
 * Used in BillingContent and any billing UI
 */

import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import type { BillingPeriod } from '@/lib/billing';

interface BillingPeriodSelectorProps {
  selected: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
  t: (key: string, defaultValue?: string) => string;
}

export function BillingPeriodSelector({ selected, onChange, t }: BillingPeriodSelectorProps) {
  const periods: BillingPeriod[] = ['yearly_commitment', 'monthly'];

  return (
    <View className="mb-4">
      <View className="flex-row gap-2">
        {periods.map((period) => (
          <Pressable
            key={period}
            onPress={() => onChange(period)}
            className={`flex-1 p-3 rounded-xl border-2 ${
              selected === period
                ? 'bg-primary/10 border-primary'
                : 'bg-card border-border'
            }`}
          >
            <Text className={`text-center text-sm font-roobert-medium ${
              selected === period ? 'text-primary' : 'text-foreground'
            }`}>
              {period === 'yearly_commitment'
                ? t('billing.yearly', 'Yearly')
                : t('billing.monthly', 'Monthly')}
            </Text>
            {period === 'yearly_commitment' && (
              <Text className="text-xs text-green-600 text-center mt-1">
                {t('billing.savePercent', 'Save 20%')}
              </Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

