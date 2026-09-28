import { useEffect } from 'react';
import AgencyHero from '@/components/agency/AgencyHero';
import AgencyExpertise from '@/components/agency/AgencyExpertise';
import AgencyApproach from '@/components/agency/AgencyApproach';
import AgencyResources from '@/components/agency/AgencyResources';

export default function StrategicHome() {
  useEffect(() => { document.title = 'Strategic Minds AI — Strategy First. Intelligence Applied.'; }, []);
  return <main><AgencyHero /><AgencyExpertise /><AgencyApproach /><AgencyResources /></main>;
}