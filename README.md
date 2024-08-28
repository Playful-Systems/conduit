# Conduit

An axios like http client that uses fetch under the hood.

[NPM Package](https://www.npmjs.com/package/@playful-systems/conduit)

## Instantiating

```ts
import { Conduit } from '@packages/conduit';

const conduit = Conduit.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
});
```

## Requests

Conduit supports all the popular request methods.

### GET
```ts
const response = await conduit.get('/posts');
const posts = response.data;
```

### POST
```ts
const response = await conduit.post('/posts', {
  title: 'foo',
  body: 'bar',
  userId: 1,
});
const post = response.data;
```

### PUT
```ts
const response = await conduit.put('/post', {
  id: 1,
  title: 'foo',
  body: 'bar',
  userId: 1,
});
```

### PATCH
```ts
const response = await conduit.patch('/post', {
  id: 1,
  title: 'foo',
});
```

### DELETE
```ts
const response = await conduit.delete('/post', {
  id: 1,
});
```