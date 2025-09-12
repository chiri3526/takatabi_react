import React from 'react';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import Sidebar from './Sidebar';

const Main = styled.main`
  padding-top: 0; // ヘッダーがなくなったので0に
  min-height: calc(100vh - 100px);
`;

const Footer = styled.footer`
  background-color: ${theme.colors.primary};
  color: ${theme.colors.white};
  padding: ${theme.spacing.large};
  text-align: center;
`;

const Layout = ({ children }) => {
  return (
    <>
      <Sidebar />
      <Main>{children}</Main>
      <Footer>
        <p>&copy; 2025 takatabi All Rights Reserved.</p>
      </Footer>
    </>
  );
};

export default Layout;
