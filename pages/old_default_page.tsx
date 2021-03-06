import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

import { useSelector, useDispatch, Provider } from 'react-redux';
import { fetchAllVizData} from '../app/store';
import { useAppSelector } from '../app/hooks';
import { store } from '../app/store_definition';

// async function fetchData() {
//   const response = await fetch('http://localhost:3000/out.json');
//   if (response.ok) {
//     const jsonData = response.json();
//     return jsonData;
//   } else {
//     return Promise.reject(response.status);
//   }
// }

export default function Home() {

  // console.time("fetchRequest");
  // fetchData().then(
  //   data => console.log(`fetched ${data.length} entries`),
  //   errorCode => console.error(`error fetching data: ${errorCode}`)
  // );
  // console.timeEnd("fetchRequest");

  return (
    <Provider store={store}>
      <Counter/>
      <div className={styles.container}>
        <Head>
          <title>Values</title>
          <meta name="description" content="Generated by create next app" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className={styles.main}>
          <h1 className={styles.title}>
            Values
        </h1>

          <p className={styles.description}>
            Get started by editing{' '}
            <code className={styles.code}>pages/index.js</code>
          </p>

          <div className={styles.grid}>
            <a href="https://nextjs.org/docs" className={styles.card}>
              <h2>Documentation &rarr;</h2>
              <p>Find in-depth information about Next.js features and API.</p>
            </a>

            <a href="https://nextjs.org/learn" className={styles.card}>
              <h2>Learn &rarr;</h2>
              <p>Learn about Next.js in an interactive course with quizzes!</p>
            </a>

            <a
              href="https://github.com/vercel/next.js/tree/master/examples"
              className={styles.card}
            >
              <h2>Examples &rarr;</h2>
              <p>Discover and deploy boilerplate example Next.js projects.</p>
            </a>

            <a
              href="https://vercel.com/new?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
              className={styles.card}
            >
              <h2>Deploy &rarr;</h2>
              <p>
                Instantly deploy your Next.js site to a public URL with Vercel.
            </p>
            </a>
          </div>
        </main>

        <footer className={styles.footer}>
          <a
            href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Powered by{' '}
            <span className={styles.logo}>
              <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
            </span>
          </a>
        </footer>
      </div>
    </Provider>
  )
}

const Counter = (props) => {
  const state = useAppSelector((state) => state.rawData.loadingState)
  const allEntries = useAppSelector((state) => state.rawData.allEntries)
  const dispatch = useDispatch();

  return (
    <div>
      <button
          aria-label="Increment value"
          onClick={() => dispatch(fetchAllVizData())}
      >
        loadAllData {state}
      </button>
      <span> data length: {allEntries.length}</span>
    </div>
  );
}