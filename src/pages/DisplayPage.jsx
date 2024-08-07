import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'
import { Card, Avatar, Text, Heading, Box, Flex, Button } from '@radix-ui/themes'
import {
  PersonIcon,
  Link2Icon,
  ExternalLinkIcon,
  Pencil1Icon
} from '@radix-ui/react-icons'
import LoadingSpinner from '../components/LoadingSpinner'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '../utils/animationVariants';


const MotionCard = motion(Card)
const MotionFlex = motion(Flex)

export default function DisplayPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [page, setPage] = useState(null)
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  
  useEffect(() => {
    async function fetchPageAndLinks() {
      setLoading(true)
      try {
        // Fetch page data
        const { data: pageData, error: pageError } = await supabase
          .from('pages')
          .select('*')
          .eq('slug', slug)
          .single()

        if (pageError) {
          if (pageError.code === 'PGRST116') {
            // No rows found, navigate to 404
            navigate('/404')
            return
          }
          // Other error occurred
          throw pageError
        }
        
        setPage(pageData)

        // Fetch avatar URL
        const { data: avatarData, error: avatarError } = await supabase
          .from('images')
          .select('image_url')
          .eq('user_id', pageData.user_id)
          .single()

        if (avatarError) {
          console.error('Error fetching avatar:', avatarError)
        } else {
          setAvatarUrl(avatarData?.image_url)
        }

        // Fetch links associated with the page
        const { data: linksData, error: linksError } = await supabase
          .from('links')
          .select('*')
          .eq('page_id', pageData.id)
          .order('created_at', { ascending: true })

        if (linksError) throw linksError
        setLinks(linksData)

        // Logged in check for user to display edit button
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

      } catch (error) {
        console.error('Error fetching page:', error)
        setError('Failed to load page. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchPageAndLinks()
  }, [slug, navigate])

  const handleAvatarClick = () => {
    if (user && user.id === page.user_id) {
      navigate('/profile');
    }
  };

  function getFaviconUrl(url) {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch (error) {
      console.error('Invalid URL:', url);
      return null;
    }
  }

  if (loading) return <LoadingSpinner message="Loading..." />
  if (error) return <div>Error: {error}</div>
  if (!page) return <div>Page not found</div>

  return (
    <Flex justify="center" align="center" style={{ minHeight: '80vh', padding: '20px' }}>
      <MotionCard
        style={{ maxWidth: '600px', width: '100%' }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <MotionFlex direction="column" align="center" gap="3" variants={itemVariants}>
        <motion.div 
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.9 }}
            onClick={handleAvatarClick}
            style={{ cursor: user && user.id === page.user_id ? 'pointer' : 'default' }}
          >
            <Avatar
              size="6"
              src={avatarUrl}
              fallback={page.title[0]}
            />
          </motion.div>
          <Heading size="8">{page.title}</Heading>
          <Flex align="center" gap="2">
            <PersonIcon />
            <Text>{page.description}</Text>
          </Flex>

          {links.length > 0 && (
            <Box width="100%">
              {links.map(link => (
                <motion.a
                  key={link.id}
                  href={link.url}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <MotionCard style={{ marginBottom: '10px', textAlign: 'center' }} variants={itemVariants}>
                    <Flex direction="column" align="center" gap="2">
                      <motion.img
                        src={link.image_url || getFaviconUrl(link.url)}
                        alt={link.title}
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/assets/react.svg';
                        }}
                        whileHover={{ rotate: 5 }}
                      />
                      <Text as="div" weight="bold">
                        <Flex align="center" justify="center" gap="1">
                          <Link2Icon />
                          {link.title}
                          <ExternalLinkIcon />
                        </Flex>
                      </Text>
                      <Text as="div" size="2" color="gray">
                        {link.description}
                      </Text>
                    </Flex>
                  </MotionCard>
                </motion.a>
              ))}
            </Box>
          )}

          {user && user.id === page.user_id && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild>
                <Link to={`/${page.slug}/edit`}>
                  <Flex align="center" gap="1">
                    <Pencil1Icon />
                    Edit Page
                  </Flex>
                </Link>
              </Button>
            </motion.div>
          )}
        </MotionFlex>
      </MotionCard>
    </Flex>
  )
}
