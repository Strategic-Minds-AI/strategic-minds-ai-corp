import { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function useLeadSubmission(formType, onSuccess) {
  const id = useRef(crypto.randomUUID());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const busy = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError('');
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    try {
      const response = await base44.functions.invoke('captureAgencyLead', { ...values, id: id.current, form_type: formType });
      if (!response.data.ok) throw new Error('Submission failed');
      setSuccess(true);
      id.current = crypto.randomUUID();
      form.reset();
      onSuccess?.();
    } catch {
      setError('Your details could not be saved. Please try again.');
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return { submit, pending, error, success };
}