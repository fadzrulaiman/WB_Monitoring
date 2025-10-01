import { useNavigate } from "react-router-dom";

const UnauthorizedPage = () => {
    const navigate = useNavigate();
    const goBack = () => navigate(-1);

    return (
        <section className="p-8 text-center">
            <h1 className="text-2xl font-bold">Unauthorized</h1>
            <p>You do not have access to the requested page.</p>
            <button onClick={goBack} className="mt-4 px-4 py-2 text-white bg-indigo-600 rounded-md">Go Back</button>
        </section>
    )
}

export default UnauthorizedPage;