import React from 'react';
import styles from './layout.module.scss';

type Props = {
    children: React.ReactNode;
};

export default function Layout({ children }: Props) {
    return <div className={styles.layout}>{children}</div>;
}
