import { useState, useEffect } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';

export function useSubscription() {
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const checkPremium = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        if (typeof customerInfo.entitlements.active['Premium'] !== "undefined") {
          setIsPremium(true);
        }
      } catch (e) {
        console.error("Error fetching customer info", e);
      }
    };

    checkPremium();
    
    // Listen for updates
    Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
      setIsPremium(typeof info.entitlements.active['Premium'] !== "undefined");
    });
  }, []);

  return { isPremium };
}
