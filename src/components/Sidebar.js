import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { theme } from '../styles/theme';

const SidebarContainer = styled.div`
  position: fixed;
  top: 0;
  left: ${props => props.isOpen ? '0' : '-250px'};
  width: 250px;
  height: 100vh;
  background-color: ${theme.colors.white};
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
  z-index: 1000;
  padding-top: 60px;
`;

const MenuButton = styled.button`
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1001;
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 30px;
  height: 25px;

  span {
    display: block;
    height: 3px;
    width: 100%;
    background-color: ${theme.colors.white};
    transition: transform 0.3s ease;
  }

  &:hover span {
    background-color: ${theme.colors.accent};
  }
`;

const CategoryList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const CategoryItem = styled.li`
  padding: ${theme.spacing.medium};
  border-bottom: 1px solid ${theme.colors.background};

  a {
    text-decoration: none;
    color: ${theme.colors.text};
    display: block;

    &:hover {
      color: ${theme.colors.primary};
    }
  }
`;

const categories = [
  { id: 1, name: '国内旅行', slug: 'domestic' },
  { id: 2, name: '海外旅行', slug: 'overseas' },
  { id: 3, name: 'グルメ', slug: 'food' },
  { id: 4, name: '宿泊記', slug: 'hotels' },
  { id: 5, name: '観光スポット', slug: 'spots' }
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <MenuButton onClick={toggleMenu}>
        <span style={{ transform: isOpen ? 'rotate(45deg) translate(8px, 8px)' : 'none' }} />
        <span style={{ opacity: isOpen ? '0' : '1' }} />
        <span style={{ transform: isOpen ? 'rotate(-45deg) translate(7px, -7px)' : 'none' }} />
      </MenuButton>
      <SidebarContainer isOpen={isOpen}>
        <CategoryList>
          {categories.map(category => (
            <CategoryItem key={category.id}>
              <Link to={`/category/${category.slug}`} onClick={() => setIsOpen(false)}>
                {category.name}
              </Link>
            </CategoryItem>
          ))}
        </CategoryList>
      </SidebarContainer>
    </>
  );
};

export default Sidebar;
