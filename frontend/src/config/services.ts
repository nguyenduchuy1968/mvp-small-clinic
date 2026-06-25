export interface Service {
  key: string;
  icon: string;
}

export const services: Service[] = [
  {
    key: 'generalConsultation',
    icon: '🩺',
  },
  {
    key: 'internalMedicine',
    icon: '🏥',
  },
  {
    key: 'pediatrics',
    icon: '👶',
  },
  {
    key: 'preventiveCare',
    icon: '🛡️',
  },
];
