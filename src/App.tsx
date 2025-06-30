import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import ErrorDisplay from './components/ErrorDisplay';

function App() {
    return (
        <>
            <RouterProvider router={router} />
            <ErrorDisplay />
        </>
    );
}

export default App;
