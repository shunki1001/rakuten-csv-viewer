import React, { useEffect, useRef } from 'react';

const HUBSPOT_PORTAL_ID = 'YOUR_PORTAL_ID'; // HubSpotのポータルIDに置き換えてください
const HUBSPOT_FORM_ID = 'YOUR_FORM_ID'; // HubSpotのフォームIDに置き換えてください

function EmailForm({ onSubmit }) {
  const formRef = useRef(null);

  useEffect(() => {
    // HubSpotフォームのスクリプトを読み込み
    const script = document.createElement('script');
    script.src = 'https://js.hsforms.net/forms/v2.js';
    script.async = true;
    script.onload = () => {
      if (window.hbspt) {
        window.hbspt.forms.create({
          portalId: HUBSPOT_PORTAL_ID,
          formId: HUBSPOT_FORM_ID,
          target: formRef.current,
          onFormSubmit: () => {
            onSubmit();
          },
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      // クリーンアップでスクリプト削除
      document.body.removeChild(script);
    };
  }, [onSubmit]);

  return (
    <div>
      <h2>メールアドレスのご入力とプライバシーポリシーへの同意をお願いします</h2>
      <div ref={formRef}></div>
    </div>
  );
}

export default EmailForm;
