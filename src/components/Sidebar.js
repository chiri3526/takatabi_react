import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { theme } from '../styles/theme';
import { FaChevronDown, FaChevronRight, FaMapMarkerAlt, FaGlobeAsia, FaCouch, FaTrain, FaHome, FaInfoCircle, FaEnvelope } from 'react-icons/fa';

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
  /* ハンバーガーメニューと重ならないようリスト位置を下げる */
  padding-top: 100px;

  /* モバイル等でコンパクトにしたい場合は少し小さめに */
  @media (max-width: 480px) {
    padding-top: 80px;
  }
`;

const MenuButton = styled.button`
  position: fixed;
  top: 60px; // 座標を下にずらす
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
    background-color: black;
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
    display: flex;
    align-items: center;
    gap: 12px;

    &:hover {
      color: ${theme.colors.primary};
    }
  }
`;

const CategoryLink = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  color: ${theme.colors.text};
  text-decoration: none;

  &:hover {
    color: ${theme.colors.primary};
  }
`;

const CategoryIcon = styled.div`
  color: ${props => props.color || theme.colors.primary};
  font-size: 1.2rem;
  min-width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const InformationSection = styled.div`
  margin-top: 2rem;
  padding: 0 ${theme.spacing.medium};
`;

const SectionTitle = styled.h3`
  color: ${theme.colors.text}99;
  font-size: 0.85rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
    icon: <FaMapMarkerAlt />,
    color: '#28a745'
    /* 詳細分類は一時的に非表示にするためコメントアウト（将来再表示可能）
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
    */
  },
  { 
    id: 2, 
    name: '海外旅行', 
    slug: 'overseas',
    icon: <FaGlobeAsia />,
    color: '#28a745'
  },
  { 
    id: 3, 
    name: 'ラウンジ', 
    slug: 'lounge',
    icon: <FaCouch />,
    color: '#28a745'
  },
  { 
    id: 4, 
    name: '鉄道', 
    slug: 'train',
    icon: <FaTrain />,
    color: '#28a745'
  }
];

const informationItems = [
  {
    id: 'home',
    name: 'Home',
    link: '/',
    icon: <FaHome />,
    color: '#28a745'
  },
  {
    id: 'about',
    name: 'About Us',
    link: '/about',
    icon: <FaInfoCircle />,
    color: '#28a745'
  },
  {
    id: 'contact',
    name: 'Contact',
    link: '/contact',
    icon: <FaEnvelope />,
    color: '#28a745'
  }
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
                  <CategoryLink onClick={() => toggleSub(category.id)}>
                    <CategoryIcon color={category.color}>
                      {category.icon}
                    </CategoryIcon>
                    <span style={{ fontWeight: 'bold', flex: 1 }}>
                      {category.name}
                    </span>
                    <span style={{ fontSize: '0.8em' }}>
                      {openSub[category.id] ? <FaChevronDown /> : <FaChevronRight />}
                    </span>
                  </CategoryLink>
                  {openSub[category.id] && (
                    <SubCategoryList>
                      {category.children.map(sub => (
                        <SubCategoryItem key={sub.id}>
                          <Link to={`/?category=${sub.slug}`} onClick={() => setIsOpen(false)}>
                            {sub.name}
                          </Link>
                        </SubCategoryItem>
                      ))}
                    </SubCategoryList>
                  )}
                </>
              ) : (
                <Link to={`/?category=${category.slug}`} onClick={() => setIsOpen(false)}>
                  <CategoryIcon color={category.color}>
                    {category.icon}
                  </CategoryIcon>
                  <span>{category.name}</span>
                </Link>
              )}
            </CategoryItem>
          ))}
        </CategoryList>
        
        <InformationSection>
          <SectionTitle>Information</SectionTitle>
          <CategoryList>
            {informationItems.map(item => (
              <CategoryItem key={item.id}>
                <Link to={item.link} onClick={() => setIsOpen(false)}>
                  <CategoryIcon color={item.color}>
                    {item.icon}
                  </CategoryIcon>
                  <span>{item.name}</span>
                </Link>
              </CategoryItem>
            ))}
          </CategoryList>
        </InformationSection>
      </SidebarContainer>
    </>
  );
};

export default Sidebar;
