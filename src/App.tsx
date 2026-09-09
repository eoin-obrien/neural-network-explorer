import { Container, Text, Title } from '@mantine/core';
import type { ReactElement } from 'react';

export function App(): ReactElement {
  return (
    <Container size="md" py="xl">
      <Title order={1}>Neural network explorer</Title>
      <Text>Scaffold only: the network model is not implemented yet.</Text>
    </Container>
  );
}
