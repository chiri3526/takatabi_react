import React from 'react';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import Sidebar from './Sidebar';

const Header = styled.header`
  background-color: rgba(46, 125, 50, 0.9); // 半透明の緑色
  padding: ${theme.spacing.medium};
  color: ${theme.colors.white};
  position: fixed;
  width: 100%;
  z-index: 999;
  backdrop-filter: blur(5px);
`;

const Nav = styled.nav`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-left: 60px; // ハンバーガーメニューのスペース
`;

const Logo = styled(Link)`
  color: ${theme.colors.white};
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
`;

const Main = styled.main`
  padding-top: 60px; // ヘッダーの高さ分のパディング
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
      <Header>
        <Nav>
          <Logo to="/">旅行ブログ</Logo>
        </Nav>
      </Header>
      <Main>{children}</Main>
      <Footer>
        <p>&copy; 2025 旅行ブログ All Rights Reserved.</p>
      </Footer>
    </>
  );
};

export default Layout;
