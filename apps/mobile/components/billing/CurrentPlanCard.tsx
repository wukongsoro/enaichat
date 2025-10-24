/**
 * Current Plan Card Component
 * 
 * Displays user's current subscription plan and trial status
 */

import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { CreditCard, Clock } from 'lucide-react-native';

interface CurrentPlanCardProps {
  displayPlan: string;
  hasActiveTrial: boolean;
  isFreePlan: boolean;
  t: (key: string) => string;
}

export function CurrentPlanCard({
  displayPlan,
  hasActiveTrial,
  isFreePlan,
  t,
}: CurrentPlanCardProps) {
  return (
    <View className="bg-card border-[1.5px] border-border rounded-2xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Icon as={CreditCard} size={18} className="text-primary" strokeWidth={2} />
          <Text className="text-sm font-roobert-medium text-muted-foreground">
            {t('billing.currentPlan')}
          </Text>
        </View>
      </View>
      
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-lg font-roobert-semibold text-foreground">
            {displayPlan}
          </Text>
          {hasActiveTrial && (
            <View className="flex-row items-center gap-1.5 mt-1">
              <Icon as={Clock} size={14} className="text-primary" strokeWidth={2} />
              <Text className="text-xs font-roobert-medium text-primary">
                {t('billing.trialActive')}
              </Text>
            </View>
          )}
        </View>
        
        {isFreePlan && !hasActiveTrial && (
          <View className="bg-primary px-3 py-1.5 rounded-full">
            <Text className="text-xs font-roobert-medium text-primary-foreground">
              {t('billing.upgradePlan')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

