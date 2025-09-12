import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { theme } from '../styles/theme';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

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

const SubCategoryList = styled.ul`
  list-style: none;
  padding-left: 1.5em;
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

const SubCategoryItem = styled.li`
  padding: 4px 0;

  a {
    text-decoration: none;
    color: ${theme.colors.text};
    display: block;
    font-size: 0.95em;
    padding-left: 0.5em;
    &:hover {
      color: ${theme.colors.primary};
      font-weight: bold;
    }
  }
`;

const categories = [
  {
    id: 1,
    name: '国内旅行',
    slug: 'domestic',
    children: [
      { id: 11, name: '北海道', slug: 'hokkaido' },
      { id: 12, name: '東北', slug: 'tohoku' },
      { id: 13, name: '関東', slug: 'kanto' },
      { id: 14, name: '東海', slug: 'tokai' },
      { id: 15, name: '北陸', slug: 'hokuriku' },
      { id: 16, name: '関西', slug: 'kansai' },
      { id: 17, name: '中国', slug: 'chugoku' },
      { id: 18, name: '四国', slug: 'shikoku' },
      { id: 19, name: '九州', slug: 'kyushu' },
      { id: 20, name: '沖縄', slug: 'okinawa' }
    ]
  },
  { id: 2, name: '海外旅行', slug: 'overseas' },
  { id: 3, name: 'ラウンジ', slug: 'lounge' },
  { id: 4, name: '鉄道', slug: 'train' }
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSub, setOpenSub] = useState({});

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  const toggleSub = (id) => {
    setOpenSub(prev => ({ ...prev, [id]: !prev[id] }));
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
              {category.children ? (
                <>
                  <span style={{ fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => toggleSub(category.id)}>
                    <span style={{ marginRight: '0.5em', fontSize: '1em' }}>
                      {openSub[category.id] ? <FaChevronDown /> : <FaChevronRight />}
                    </span>
                    {category.name}
                  </span>
                  {openSub[category.id] && (
                    <SubCategoryList>
                      {category.children.map(sub => (
                        <SubCategoryItem key={sub.id}>
                          <Link to={`/category/${sub.slug}`} onClick={() => setIsOpen(false)}>
                            {sub.name}
                          </Link>
                        </SubCategoryItem>
                      ))}
                    </SubCategoryList>
                  )}
                </>
              ) : (
                <Link to={`/category/${category.slug}`} onClick={() => setIsOpen(false)}>
                  {category.name}
                </Link>
              )}
            </CategoryItem>
          ))}
        </CategoryList>
      </SidebarContainer>
    </>
  );
};

export default Sidebar;
